import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Import useNavigate and RouterLink
import { supabase } from '../lib/supabaseClient'; // For Realtime (optional)

const LEADING_POLLING_INTERVAL_MS = 30000; // Poll every 30 seconds for leading participant
import type { Participant } from '../lib/types';
import { getParticipants } from '../services/participantService'; // Assuming you have this
import { fetchAllParticipantVoteCounts, type ParticipantVoteCount } from '../services/voteService';
const HomePage: React.FC = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [leadingParticipant, setLeadingParticipant] = useState<Participant | null>(null);
  const [leadingVoteCount, setLeadingVoteCount] = useState<number>(0);
  const [isLoadingLeader, setIsLoadingLeader] = useState<boolean>(true);
  const handleViewParticipantsAndVote = () => {
    navigate('/vote'); // Navigate to the voting page
  };
 const findLeadingParticipant = useCallback(async () => {
    setIsLoadingLeader(true);
    try {
      const [{ data: participantsData, error: pError }, { data: countsData, error: cError }] = await Promise.all([
        getParticipants(),
        fetchAllParticipantVoteCounts()
      ]);

      if (pError || cError) {
        console.error("Error fetching data for leading participant:", pError || cError);
        // Don't crash, just might not show a leader
        setLeadingParticipant(null);
        setLeadingVoteCount(0);
        return;
      }

      if (participantsData && countsData) {
        const countsMap: Record<string, number> = {};
        countsData.forEach(c => countsMap[c.participant_id] = c.vote_count);

        let currentLeader: Participant | null = null;
        let maxVotes = -1;

        participantsData.forEach(p => {
          const count = countsMap[p.id] || 0;
          if (count > maxVotes) {
            maxVotes = count;
            currentLeader = p;
          } else if (count === maxVotes && count > 0) {
            // Handle ties - for now, just picks the first one encountered
            // Or you could decide to show "Multiple leaders" or similar
          }
        });
        
        if (maxVotes > 0) { // Only show leader if there are votes
            setLeadingParticipant(currentLeader);
            setLeadingVoteCount(maxVotes);
        } else {
            setLeadingParticipant(null);
            setLeadingVoteCount(0);
        }
      }
    } catch (err) {
      console.error("Failed to find leading participant", err);
      setLeadingParticipant(null);
      setLeadingVoteCount(0);
    } finally {
      setIsLoadingLeader(false);
    }
  }, []);

  useEffect(() => {
    findLeadingParticipant();
    const intervalId = setInterval(findLeadingParticipant, LEADING_POLLING_INTERVAL_MS);

    // Optional: Realtime updates for leading participant
    const votesChannel = supabase
      .channel('public:votes:homepage') // Use a different channel name or be specific with filters
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        () => {
          console.log('New vote, potentially affecting leader - re-calculating leader.');
          findLeadingParticipant(); // Re-calculate leader on any new vote
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(votesChannel);
    };
  }, [findLeadingParticipant]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-navy-primary text-neutral-light-text p-4 sm:p-6 md:p-8 relative bg-blue-100"> {/* Added relative for footer positioning */}
      <header className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
          FingerVote
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-opacity-90 max-w-2xl mx-auto">
          Your Voice, Your Choice. Cast your vote with a simple touch.
        </p>
      </header>
{!isLoadingLeader && leadingParticipant && (
        <section className="mb-10 md:mb-12 p-6 bg-almost-white bg-opacity-10 rounded-xl max-w-xl w-full text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-semibold text-accent-teal mb-3">Currently Leading!</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start sm:space-x-6">
            {leadingParticipant.picture_url && (
              <img 
                src={leadingParticipant.picture_url} 
                alt={leadingParticipant.name} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-accent-teal mb-3 sm:mb-0"
              />
            )}
            <div>
              <p className="text-xl sm:text-2xl font-bold">{leadingParticipant.name}</p>
              <p className="text-md text-opacity-80">{leadingParticipant.country}</p>
              <p className="text-2xl font-bold text-accent-teal mt-1">
                {leadingVoteCount} Vote{leadingVoteCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </section>
      )}
      {!isLoadingLeader && !leadingParticipant && leadingVoteCount === 0 && (
         <p className="text-lg text-opacity-70 mb-10">Be the first to vote and set the lead!</p>
       )}
      <main className="w-full max-w-md text-center">
        <button
          type="button"
          onClick={handleViewParticipantsAndVote}
          className="
            bg-accent-teal text-navy-primary font-semibold
            text-lg md:text-xl
            py-3.5 px-8 md:py-4 md:px-10
            rounded-lg shadow-lg
            hover:bg-accent-teal-dark transition-colors duration-300 ease-in-out
            focus:outline-none focus:ring-4 focus:ring-accent-teal focus:ring-opacity-50
            transform hover:scale-105
            min-h-[48px] min-w-[48px]
          "
        >
          View Participants & Vote
        </button>

        <p className="mt-8 text-sm text-opacity-75">
          Secure, transparent, and incredibly easy.
        </p>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-opacity-60">
        <span>© {new Date().getFullYear()} FingerVote. All rights reserved.</span>
        <span className="mx-2">|</span> {/* Separator */}
        <RouterLink
          to="/admin/login"
          className="hover:text-accent-teal underline transition-colors"
        >
          Admin Login
        </RouterLink>
      </footer>
    </div>
  );
};

export default HomePage;