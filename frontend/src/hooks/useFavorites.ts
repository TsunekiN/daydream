/**
 * お気に入り管理フック
 * Firestore に永続化。リアルタイムリスナーでデバイス間同期。
 * 未ログイン時はローカルステートのみ（保存されない）。
 */
import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { SiteMode } from "@/types/novel";

export interface FavoriteNovel {
  ncode: string;
  site: SiteMode;
  title: string;
  writer: string;
  story?: string;
  addedAt: number;
  lastUpdated?: string;
  order?: number;
  lastReadEpisode?: number;
  totalEpisodes?: number;
}

function getFavDocId(ncode: string, site: SiteMode): string {
  return `${site}_${ncode.toUpperCase()}`;
}

function getFavCollectionRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return collection(db, "users", uid, "favorites");
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteNovel[]>([]);

  // Firestoreリアルタイムリスナー
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setFavorites([]);
      return;
    }

    const colRef = collection(db, "users", uid, "favorites");
    const q = query(colRef, orderBy("addedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: FavoriteNovel[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as FavoriteNovel);
      });
      setFavorites(items);
    }, (error) => {
      console.error("[Favorites] Firestore listener error:", error);
    });

    return unsubscribe;
  }, [auth.currentUser?.uid]);

  const addFavorite = useCallback(async (novel: Omit<FavoriteNovel, "addedAt">) => {
    const colRef = getFavCollectionRef();
    if (!colRef) return;

    const docId = getFavDocId(novel.ncode, novel.site);
    const data: FavoriteNovel = { ...novel, addedAt: Date.now() };
    await setDoc(doc(colRef, docId), data);
  }, []);

  const removeFavorite = useCallback(async (ncode: string, site: SiteMode) => {
    const colRef = getFavCollectionRef();
    if (!colRef) return;

    const docId = getFavDocId(ncode, site);
    await deleteDoc(doc(colRef, docId));
  }, []);

  const isFavorite = useCallback(
    (ncode: string, site: SiteMode) => {
      return favorites.some((f) => f.ncode.toUpperCase() === ncode.toUpperCase() && f.site === site);
    },
    [favorites]
  );

  const updateReadProgress = useCallback(async (ncode: string, site: SiteMode, episodeNumber: number, totalEpisodes?: number) => {
    const colRef = getFavCollectionRef();
    if (!colRef) return;

    const fav = favorites.find((f) => f.ncode.toUpperCase() === ncode.toUpperCase() && f.site === site);
    if (!fav) return; // お気に入りに入ってない場合は記録しない

    const currentMax = fav.lastReadEpisode ?? 0;
    if (episodeNumber <= currentMax && totalEpisodes === undefined) return; // 更新不要

    const docId = getFavDocId(ncode, site);
    await setDoc(doc(colRef, docId), {
      ...fav,
      lastReadEpisode: Math.max(currentMax, episodeNumber),
      ...(totalEpisodes !== undefined ? { totalEpisodes } : {}),
    });
  }, [favorites]);

  const reorderFavorites = useCallback(async (reordered: FavoriteNovel[]) => {
    const colRef = getFavCollectionRef();
    if (!colRef) return;

    const batch = writeBatch(db);
    reordered.forEach((fav, i) => {
      const docId = getFavDocId(fav.ncode, fav.site);
      batch.update(doc(colRef, docId), { order: i });
    });
    await batch.commit();
  }, []);

  const refreshLastUpdated = useCallback(async () => {
    if (favorites.length === 0) return;
    const colRef = getFavCollectionRef();
    if (!colRef) return;

    // サイト別に分割
    const narouCodes = favorites.filter((f) => f.site === "narou").map((f) => f.ncode);
    const nocturneCodes = favorites.filter((f) => f.site === "nocturne").map((f) => f.ncode);

    const updates: Record<string, { updated: string; totalEpisodes: number }> = {};

    if (narouCodes.length > 0) {
      try {
        const params = new URLSearchParams({
          ncode: narouCodes.join("-"),
          lim: narouCodes.length.toString(),
        });
        const resp = await fetch(`/api/narou/bulk-updated?${params}`);
        if (resp.ok) {
          const data: Record<string, { updated: string; totalEpisodes: number }> = await resp.json();
          Object.assign(updates, data);
        }
      } catch { /* silent */ }
    }

    if (nocturneCodes.length > 0) {
      try {
        const params = new URLSearchParams({
          ncode: nocturneCodes.join("-"),
          lim: nocturneCodes.length.toString(),
        });
        const resp = await fetch(`/api/nocturne/bulk-updated?${params}`);
        if (resp.ok) {
          const data: Record<string, { updated: string; totalEpisodes: number }> = await resp.json();
          Object.assign(updates, data);
        }
      } catch { /* silent */ }
    }

    if (Object.keys(updates).length === 0) return;

    // Firestoreに一括更新
    const batch = writeBatch(db);
    favorites.forEach((fav) => {
      const key = fav.ncode.toUpperCase();
      const info = updates[key];
      if (info) {
        const docId = getFavDocId(fav.ncode, fav.site);
        batch.update(doc(colRef, docId), {
          lastUpdated: info.updated,
          totalEpisodes: info.totalEpisodes,
        });
      }
    });
    await batch.commit();
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite, refreshLastUpdated, reorderFavorites, updateReadProgress };
}
