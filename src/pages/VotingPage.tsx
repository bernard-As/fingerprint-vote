// src/pages/VotingPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { Participant } from '../lib/types';
import { getParticipants } from '../services/participantService'; // Assuming this exists
import { recordVote, checkIfVoterHasAlreadyVotedGlobally, fetchAllParticipantVoteCounts, // <-- IMPORT
  type ParticipantVoteCount } from '../services/voteService';
import toast, { Toaster } from 'react-hot-toast';
import FingerScanModal from '../components/features/FingerScanModal'; // <-- IMPORT
// FIX: Update the import path to the correct location or create the component if missing.
// import FingerScanModal from '../components/features/FingerScanModal'; // <-- Adjust the path as needed

import { supabase } from '../lib/supabaseClient'; // For Realtime (optional)

import ParticipantCard from '../components/features/ParticipantCard';
// You might want a toast notification library for better UX
const POLLING_INTERVAL_MS = 15000;

const VotingPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
  const [hasUserVotedGlobally, setHasUserVotedGlobally] = useState<boolean>(false);
  const [votedForParticipantId, setVotedForParticipantId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [participantToVoteFor, setParticipantToVoteFor] = useState<Participant | null>(null);
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First, check if the user has already voted globally
      const voteStatus = await checkIfVoterHasAlreadyVotedGlobally();
      setHasUserVotedGlobally(voteStatus.hasVoted);
      setVotedForParticipantId(voteStatus.votedForParticipantId);

      const { data: participantData, error: participantError } = await getParticipants();
      if (participantError) throw participantError;
      if (participantData) {
        setParticipants(participantData);
                await fetchVoteCountsData();

      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
const fetchVoteCountsData = useCallback(async () => {
    const { data: countsData, error: countsError } = await fetchAllParticipantVoteCounts();
    if (countsError) {
      console.error("Failed to fetch vote counts:", countsError);
      // Don't necessarily block UI for this, existing counts can remain
    } else if (countsData) {
      const newCounts: Record<string, number> = {};
      countsData.forEach(item => {
        newCounts[item.participant_id] = item.vote_count;
      });
      setVoteCounts(newCounts);
    }
  }, []);
  useEffect(() => {
    fetchInitialData();

    // Polling for vote counts
    const intervalId = setInterval(fetchVoteCountsData, POLLING_INTERVAL_MS);

    // --- Supabase Realtime (Optional Enhancement) ---
    // Ensure your 'votes' table has Realtime enabled in Supabase Dashboard
    const votesChannel = supabase
      .channel('public:votes') // Channel name must match table name for default broadcasts
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          console.log('New vote received via Realtime!', payload);
          // When a new vote comes in, re-fetch all counts for simplicity,
          // or more granularly update the specific participant's count.
          fetchVoteCountsData(); 
          // Or, if payload.new contains participant_id:
          // const newVote = payload.new as { participant_id: string };
          // if (newVote.participant_id) {
          //   setVoteCounts(prevCounts => ({
          //     ...prevCounts,
          //     [newVote.participant_id]: (prevCounts[newVote.participant_id] || 0) + 1,
          //   }));
          // }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to votes channel!');
          // If successfully subscribed, we can potentially stop polling
          // clearInterval(intervalId); // Or reduce polling frequency
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime subscription error:', status, err);
          // Fallback to polling if Realtime fails
        }
      });
    // --- End Supabase Realtime ---

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(votesChannel); // Clean up Realtime subscription
    };
  }, [fetchInitialData, fetchVoteCountsData]); // fetchVoteCountsData added here too;

  const openFingerScan = (participant: Participant) => {
    if (hasUserVotedGlobally || isSubmittingVote) return; // Don't open if already voted or another process active
    setParticipantToVoteFor(participant);
    setIsScanModalOpen(true);
  };

  const handleScanComplete = async (fingerprintGuess: string) => {
    // `fingerprintGuess` is the mock data from the modal.
    // We are NOT using it as the voter_identifier for security/reliability reasons.
    // It's just part of the simulation.
    console.log("Simulated scan complete. Mock data:", fingerprintGuess);
    setIsScanModalOpen(false);

    if (!participantToVoteFor) return;

    // Now proceed with the actual vote recording logic
    setIsSubmittingVote(true); // For the network request
    // toast.loading('Submitting your vote...', { id: `vote-${participantToVoteFor.id}` });

    const { data, error: voteError, alreadyVotedGlobally } = await recordVote(participantToVoteFor.id);

    setIsSubmittingVote(false);
    setParticipantToVoteFor(null); // Reset

    if (voteError) {
      const message = alreadyVotedGlobally ? 'You have already cast your single vote.' : (voteError.message || 'Failed to cast vote.');
      alert(message);
      if (alreadyVotedGlobally) {
        setHasUserVotedGlobally(true);
        if (!votedForParticipantId) {
            const voteStatus = await checkIfVoterHasAlreadyVotedGlobally();
            setVotedForParticipantId(voteStatus.votedForParticipantId);
        }
      }
      return; // No need to return success/fail for the card's local state here
    }

    if (data) {
      toast.success('Vote successfully cast!',);
      // alert('Vote successfully cast!');
      setHasUserVotedGlobally(true);
      setVotedForParticipantId(data.participant_id); // participant_id from the successful vote record
      setVoteCounts(prevCounts => ({
        ...prevCounts,
        [data.participant_id]: (prevCounts[data.participant_id] || 0) + 1,
      }));
    }
  };

  const handleVote = async (participantId: string): Promise<{ success: boolean; message: string }> => {
    if (isSubmittingVote || hasUserVotedGlobally) {
      return { success: false, message: 'A vote is already in progress or you have already cast your vote.' };
    }

    setIsSubmittingVote(true);
    toast.loading('Submitting your vote...', { id: `vote-${participantId}` });

    // MODIFIED: Use alreadyVotedGlobally from the response
    const { data, error: voteError, alreadyVotedGlobally } = await recordVote(participantId);

    setIsSubmittingVote(false);

    if (voteError) {
      const message = alreadyVotedGlobally ? 'You have already cast your single vote.' : (voteError.message || 'Failed to cast vote.');
      toast.error(message, { id: `vote-${participantId}` });
      // alert(message);
      if (alreadyVotedGlobally) {
        setHasUserVotedGlobally(true);
        // If the server confirms they already voted, try to fetch for whom if not already known
        if (!votedForParticipantId) {
            const voteStatus = await checkIfVoterHasAlreadyVotedGlobally();
            setVotedForParticipantId(voteStatus.votedForParticipantId);
        }
      }
      return { success: false, message };
    }

    if (data) {
      toast.success('Vote successfully cast!', { id: `vote-${participantId}` });
      // alert('Vote successfully cast!');
      setHasUserVotedGlobally(true);
      setVotedForParticipantId(participantId); // Store which participant was voted for
      return { success: true, message: 'Vote cast!' };
    }
    return { success: false, message: 'An unknown error occurred.' };
  };

  if (isLoading && participants.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-navy-primary text-neutral-light-text text-xl"><p>Loading participants...</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-navy-primary text-status-error-light p-8 text-center">
        <p className="text-2xl mb-4">Oops! Something went wrong.</p>
        <p className="mb-6">{error}</p>
        <button onClick={fetchInitialData} className="bg-accent-teal text-navy-primary py-2 px-6 rounded-lg hover:bg-accent-teal-dark">
            Try Again
        </button>
    </div>;
  }

  if (participants.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-navy-primary text-neutral-light-text text-xl"><p>No participants available at the moment.</p></div>;
  }

  return (
    <div className="min-h-screen bg-blue-100 text-neutral-light-text p-4 sm:p-6 md:p-8">
      <Toaster position="top-center" />
      <header className="text-center mb-10 sm:mb-12 md:mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3">Meet the Participants</h1>
        <p className="text-lg sm:text-xl text-opacity-80 max-w-3xl mx-auto">
          Browse through the contenders and cast your vote for your favorite. Choose wisely!
        </p>
        <p className="text-xs text-opacity-60 mt-2">
            (Note: Voting is currently restricted per browser session. This is a demo feature.)
        </p>
      </header>
      {isLoading && participants.length === 0 && ( /* Show loader if no participants yet */
         <div className="min-h-screen flex items-center justify-center bg-navy-primary text-neutral-light-text text-xl"><p>Loading participants...</p></div>
      )}
      {!isLoading && error && ( /* Error display */
         <div className="min-h-screen flex flex-col items-center justify-center bg-navy-primary text-status-error-light p-8 text-center">
            <p className="text-2xl mb-4">Oops! Something went wrong.</p>
            <p className="mb-6">{error}</p>
            <button onClick={fetchInitialData} className="bg-accent-teal text-navy-primary py-2 px-6 rounded-lg hover:bg-accent-teal-dark">
                Try Again
            </button>
        </div>
      )}
      
      {!isLoading && !error && participants.length === 0 && ( /* No participants display */
         <div className="min-h-screen flex items-center justify-center bg-navy-primary text-neutral-light-text text-xl"><p>No participants available at the moment.</p></div>
      )}
      {!isLoading && !error && participants.length > 0 && (
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {participants.map(p => ( // Renamed to `p` to avoid conflict
            <ParticipantCard
              key={p.id}
              participant={p}
              // MODIFIED: onVote prop now triggers opening the modal
              onVoteInitiate={() => openFingerScan(p)} // Pass a new prop or adapt existing onVote
              hasVoted={votedForParticipantId === p.id}
              canVote={!hasUserVotedGlobally && !isSubmittingVote} // Can user initiate any vote?
              isProcessingVote={isSubmittingVote} // Is a network vote request active?
              voteCount={voteCounts[p.id] || 0}
            />
          ))}
        </main>
      )}

      <footer className="text-center mt-12 md:mt-16 text-sm text-opacity-70">
        FingerVote © {new Date().getFullYear()}
      </footer>
      {participantToVoteFor && (
        <FingerScanModal
          isOpen={isScanModalOpen}
          onClose={() => { setIsScanModalOpen(false); setParticipantToVoteFor(null); }}
          onScanComplete={handleScanComplete}
          participantName={participantToVoteFor.name}
        />
      )}
    </div>
  );
};

export default VotingPage;