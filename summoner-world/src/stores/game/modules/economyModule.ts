import type { GameStore, CommunityState, SetState } from '../types.ts';
import { createLog } from '../helpers.ts';
import { applyPlayerStatisticEvent } from '../../../core/playerCore/playerStatisticsTracking';
import { economyEventBus } from '../../../core/economy/economyEventBus';
import axios from 'axios';

function buildValidatedUrl(
  baseUrl: string,
  playerId?: string,
  targetId?: string,
  query?: string
): string {
  try {
    const url = new URL(baseUrl);
    
    // Validate path parameters
    if (playerId && !/^[A-Za-z0-9_-]+$/.test(playerId)) {
      throw new Error('Invalid parameter');
    }
    if (targetId && !/^[A-Za-z0-9_-]+$/.test(targetId)) {
      throw new Error('Invalid parameter');
    }
    
    // Rebuild pathname from fixed literals + validated segments
    if (playerId && targetId) {
      url.pathname = `/api/community/messages/${playerId}/${targetId}`;
    } else if (playerId) {
      url.pathname = `/api/community/search/${playerId}`;
    }
    
    // Add query parameters
    if (query !== undefined) url.searchParams.set('q', query);
    
    return url.href;
  } catch {
    throw new Error('Invalid URL');
  }
}

export const economyActions = (set: SetState<GameStore>, get: () => GameStore) => ({
  openCommunity: (tab?: CommunityState['tab']) => {
    const { community } = get();
    set({ screen: 'community', community: { ...community, tab: tab || 'nearby' } });
  },

  refreshCommunity: async () => {
    const { player } = get();
    if (!player) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/community/nearby/${player.id}`);
      set((state: any) => ({
        community: { ...state.community, players: res.data.players || [] }
      }));
    } catch (err) {
      console.error('Failed to refresh community', err);
    }
  },

  getCommunityPlayers: async (query?: string) => {
    const { player } = get();
    if (!player) return;
    try {
      const res = await axios.get(buildValidatedUrl('http://localhost:5000', player.id, undefined, query || ''));
      set((state: any) => ({
        community: { ...state.community, players: res.data.players || [] }
      }));
    } catch (err) {
      console.error('Failed to search community', err);
    }
  },

  selectCommunityPlayer: (playerId: string | null) => {
    set((state: any) => ({
      community: { ...state.community, selectedPlayerId: playerId }
    }));
  },

  sendCommunityMessage: async (targetId: string, body: string) => {
    const { player } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/message`, { senderId: player.id, recipientId: targetId, body });
      get().loadCommunityConversations();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  },

  loadCommunityMessages: async (targetId: string) => {
    const { player } = get();
    if (!player) return;
    try {
      const res = await axios.get(buildValidatedUrl('http://localhost:5000', player.id, targetId));
      set((state: any) => ({
        community: { ...state.community, messages: res.data.messages || [] }
      }));
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  },

  loadCommunityConversations: async () => {
    const { player } = get();
    if (!player) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/community/conversations/${player.id}`);
      set((state: any) => ({
        community: { ...state.community, conversations: res.data.conversations || [] }
      }));
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  },

  blockUser: async (targetId: string) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/block`, { playerId: player.id, targetId });
      appendLog('User blocked.', 'system');
    } catch (err) {
      console.error('Failed to block user', err);
    }
  },

  unblockUser: async (targetId: string) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/unblock`, { playerId: player.id, targetId });
      appendLog('User unblocked.', 'system');
    } catch (err) {
      console.error('Failed to unblock user', err);
    }
  },

  reportUser: async (targetId: string, reason: string, details?: string) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/report`, { reporterId: player.id, targetId, reason, details });
      appendLog('Report submitted. Thank you.', 'system');
    } catch (err) {
      console.error('Failed to report user', err);
    }
  },

  createTrade: async (targetId: string, offeredItems: Array<{ itemKey: string; quantity: number; label?: string }>, requestedItems?: Array<{ itemKey: string; quantity: number; label?: string }>) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/trade`, { initiatorId: player.id, targetId, offeredItems, requestedItems });
      economyEventBus.publish({
        type: 'ItemTraded',
        tradeId: '',
        initiatorId: player.id,
        targetId,
        offeredItems: offeredItems.map((i) => ({ itemKey: i.itemKey, quantity: i.quantity })),
        requestedItems: (requestedItems || []).map((i) => ({ itemKey: i.itemKey, quantity: i.quantity })),
        timestamp: Date.now(),
      });
      appendLog('Trade offer sent.', 'system');
    } catch (err) {
      console.error('Failed to create trade', err);
    }
  },

  acceptTrade: async (tradeId: string) => {
    const { appendLog } = get();
    try {
      const res = await axios.post(`http://localhost:5000/api/community/trade/${tradeId}/accept`);
      if (res.data?.success === false) {
        appendLog('Trade could not be accepted.', 'warning');
        return;
      }
      const { player } = get();
      if (!player) {
        appendLog('Trade accepted but local player state was unavailable.', 'warning');
        return;
      }
      economyEventBus.publish({
        type: 'ItemTraded',
        tradeId,
        initiatorId: res.data?.trade?.initiatorId || '',
        targetId: player.id,
        offeredItems: res.data?.trade?.offeredItems || [],
        requestedItems: res.data?.trade?.requestedItems || [],
        timestamp: Date.now(),
      });
      set((state) => state.playerCore ? ({
        playerCore: {
          ...state.playerCore,
          statistics: applyPlayerStatisticEvent(state.playerCore.statistics, { type: 'TradeCompleted' }),
        },
      }) : {});
      appendLog('Trade accepted.', 'success');
    } catch (err) {
      console.error('Failed to accept trade', err);
    }
  },

  declineTrade: async (tradeId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/trade/${tradeId}/decline`);
      appendLog('Trade declined.', 'info');
    } catch (err) {
      console.error('Failed to decline trade', err);
    }
  },

  invitePlayerToParty: async (targetId: string, partyId?: string) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/party/invite`, { inviterId: player.id, targetId, partyId });
      appendLog('Party invite sent.', 'system');
    } catch (err) {
      console.error('Failed to invite to party', err);
    }
  },

  acceptPartyInvite: async (partyId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/party/${partyId}/accept`);
      appendLog('Joined party!', 'success');
    } catch (err) {
      console.error('Failed to accept party invite', err);
    }
  },

  declinePartyInvite: async (partyId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/party/${partyId}/decline`);
      appendLog('Declined party invite.', 'info');
    } catch (err) {
      console.error('Failed to decline party invite', err);
    }
  },

  leaveParty: async (partyId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/party/${partyId}/leave`);
      appendLog('Left the party.', 'system');
    } catch (err) {
      console.error('Failed to leave party', err);
    }
  },

  createGuild: async (name: string) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/community/guild`, { creatorId: player.id, name });
      set((state: any) => ({
        community: { ...state.community, guilds: [...state.community.guilds, res.data.guild] }
      }));
      appendLog(`Guild "${name}" created!`, 'success');
    } catch (err) {
      console.error('Failed to create guild', err);
    }
  },

  invitePlayerToGuild: async (targetId: string, guildId?: string) => {
    const { player, appendLog } = get();
    if (!player) return;
    try {
      await axios.post(`http://localhost:5000/api/community/guild/invite`, { inviterId: player.id, targetId, guildId });
      appendLog('Guild invite sent.', 'system');
    } catch (err) {
      console.error('Failed to invite to guild', err);
    }
  },

  acceptGuildInvite: async (guildId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/guild/${guildId}/accept`);
      appendLog('Joined guild!', 'success');
    } catch (err) {
      console.error('Failed to accept guild invite', err);
    }
  },

  declineGuildInvite: async (guildId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/guild/${guildId}/decline`);
      appendLog('Declined guild invite.', 'info');
    } catch (err) {
      console.error('Failed to decline guild invite', err);
    }
  },

  leaveGuild: async (guildId: string) => {
    const { appendLog } = get();
    try {
      await axios.post(`http://localhost:5000/api/community/guild/${guildId}/leave`);
      appendLog('Left the guild.', 'system');
    } catch (err) {
      console.error('Failed to leave guild', err);
    }
  },
});
