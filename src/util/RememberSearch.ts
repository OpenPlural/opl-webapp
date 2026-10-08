import { SearchFlags } from '../components/search-options/search-options';
import { UserId } from '../services/model/User';

let rememberedSearch: RememberedSearch = {
  friendId: null,
  query: null,
  flags: null,
};

export function rememberLocalSearch(query: string | null, flags: SearchFlags | null) {
  rememberedSearch = {
    friendId: null,
    query,
    flags,
  };
}

export function rememberFriendSearch(friendId: UserId, query: string | null, flags: SearchFlags | null) {
  rememberedSearch = {
    friendId,
    query,
    flags,
  };
}

export function getRememberedLocalSearch(): { query: string | null; flags: SearchFlags | null } | null {
  if (rememberedSearch.friendId === null) {
    return {
      query: rememberedSearch.query,
      flags: rememberedSearch.flags,
    };
  }
  return null;
}

export function getRememberedFriendSearch(friendId: UserId): { query: string | null; flags: SearchFlags | null } | null {
  if (rememberedSearch.friendId === friendId) {
    return {
      query: rememberedSearch.query,
      flags: rememberedSearch.flags,
    };
  }
  return null;
}

export function forgetRememberedSearch() {
  rememberedSearch = {
    friendId: null,
    query: null,
    flags: null,
  };
}

interface RememberedSearch {
  friendId: UserId | null;
  query: string | null;
  flags: SearchFlags | null;
}
