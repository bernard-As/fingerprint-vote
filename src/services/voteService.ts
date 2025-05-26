// src/services/voteService.ts
import { supabase } from '../lib/supabaseClient';
import { type Vote } from '../lib/types';

export interface ParticipantVoteCount {
  participant_id: string;
  vote_count: number;
}

const VOTES_TABLE = 'votes';

const getOrSetVoterIdentifier = (): string => {
  let voterId = localStorage.getItem('fingerVoteVoterId');
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem('fingerVoteVoterId', voterId);
  }
  return voterId;
};

// MODIFIED: To reflect "one vote per voter in total" logic
export const recordVote = async (participantId: string): Promise<{ data: Vote | null, error: any, alreadyVotedGlobally?: boolean }> => {
  const voter_identifier = getOrSetVoterIdentifier();

  // Client-side check (deterrent, not foolproof)
  const hasVotedGloballyClient = localStorage.getItem('fingerVoteGlobalVoteCast') === voter_identifier;
  if (hasVotedGloballyClient) {
    console.warn("Client-side check: Already voted globally in this browser session.");
    return { data: null, error: { message: 'You have already cast your single vote.' }, alreadyVotedGlobally: true };
  }

  const voteData: Omit<Vote, 'id' | 'created_at'> = {
    participant_id: participantId,
    voter_identifier,
  };

  // The unique constraint on (participant_id, voter_identifier) in Supabase helps if this function
  // were to be called multiple times for the SAME participant by the same voter.
  // However, to enforce "only one vote overall" by a voter_identifier, we'd typically need
  // another unique constraint just on `voter_identifier` IF a voter can only ever vote once
  // in the entire system's lifetime.
  // OR, before inserting, query if this voter_identifier already exists in the 'votes' table.

  // Let's add a pre-check query for the "one vote overall" rule
  const { data: existingVotes, error: checkError } = await supabase
    .from(VOTES_TABLE)
    .select('id')
    .eq('voter_identifier', voter_identifier)
    .limit(1);

  if (checkError) {
    return { data: null, error: checkError };
  }

  if (existingVotes && existingVotes.length > 0) {
    // Voter has already voted for someone. Update client-side state if needed.
    localStorage.setItem('fingerVoteGlobalVoteCast', voter_identifier);
    return { data: null, error: { message: 'You have already cast your single vote.' }, alreadyVotedGlobally: true };
  }

  // Proceed to insert the vote
  const { data, error } = await supabase
    .from(VOTES_TABLE)
    .insert([voteData])
    .select()
    .single();

  if (error) {
    // If for some reason a race condition occurred and the insert failed due to the
    // voter_identifier already existing (if you had a unique constraint on just voter_identifier)
    if (error.code === '23505') { // This code can also signify other unique constraint violations
        // Re-check specifically for voter_identifier existing if needed, or assume it's global.
        localStorage.setItem('fingerVoteGlobalVoteCast', voter_identifier);
        return { data: null, error: { message: 'You have already cast your single vote.' }, alreadyVotedGlobally: true };
    }
    return { data: null, error };
  }

  // Mark as voted globally in localStorage
  localStorage.setItem('fingerVoteGlobalVoteCast', voter_identifier);

  return { data, error: null };
};

// MODIFIED: Checks if the current voter has cast any vote at all
export const checkIfVoterHasAlreadyVotedGlobally = async (): Promise<{ hasVoted: boolean, votedForParticipantId: string | null }> => {
  const voter_identifier = getOrSetVoterIdentifier();
  const hasVotedGloballyClient = localStorage.getItem('fingerVoteGlobalVoteCast') === voter_identifier;

  if (hasVotedGloballyClient) {
    // To know *who* they voted for from client, we'd need to store that too.
    // For now, just confirm they voted.
    // A more robust solution would query the server.
    // Let's make this function primarily server-driven for accuracy
  }

  const { data, error } = await supabase
    .from(VOTES_TABLE)
    .select('participant_id') // Select the participant_id they voted for
    .eq('voter_identifier', voter_identifier)
    .limit(1); // A voter should only have one vote record

  if (error) {
    console.error("Error checking global vote status:", error);
    return { hasVoted: false, votedForParticipantId: null }; // Fail open (allow voting) or handle error
  }

  if (data && data.length > 0) {
    // Ensure client-side marker is set if server says they voted
    localStorage.setItem('fingerVoteGlobalVoteCast', voter_identifier);
    return { hasVoted: true, votedForParticipantId: data[0].participant_id };
  }

  return { hasVoted: false, votedForParticipantId: null };
};

export const fetchAllParticipantVoteCounts = async (): Promise<{ data: ParticipantVoteCount[] | null, error: any }> => {
  // Using the RPC function created in Supabase
  const { data, error } = await supabase.rpc('get_participant_vote_counts');
  
  // If you didn't use RPC and wanted to do client-side aggregation (less efficient):
  // const { data: allVotes, error: fetchError } = await supabase.from('votes').select('participant_id');
  // if (fetchError) return { data: null, error: fetchError };
  // const counts: Record<string, number> = {};
  // allVotes?.forEach(vote => {
  //   counts[vote.participant_id] = (counts[vote.participant_id] || 0) + 1;
  // });
  // const data = Object.entries(counts).map(([pid, count]) => ({ participant_id: pid, vote_count: count }));

  return { data, error };
};

// `getVotesByCurrentVoter` is no longer needed if only one vote is allowed globally.
// We can remove it or comment it out.