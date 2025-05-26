// src/components/features/ParticipantCard.tsx
import React from 'react';
import type { Participant } from '../../lib/types';
import { MdOutlineFingerprint } from "react-icons/md";
interface ParticipantCardProps {
  participant: Participant;
  onVoteInitiate: () => void; // RENAMED from onVote
  hasVoted: boolean; // True if this specific participant is the one the user voted for
  canVote: boolean; // True if the user has not yet cast their single global vote AND no vote is processing
  isProcessingVote: boolean; // True if any vote submission is currently active
  voteCount: number; // <-- ADDED PROP

}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onVoteInitiate,
  hasVoted, // User voted for THIS participant
  canVote, // User is allowed to vote (hasn't voted globally yet) & no vote is processing
  isProcessingVote, // A vote submission is active
    voteCount // <-- ADDED PROP

}) => {
  const handleVoteClick = async () => {
    if (!canVote || hasVoted) return; // Can't vote if global vote cast or already voted for this one (redundant with canVote)
    onVoteInitiate();
  };

  const buttonDisabled = hasVoted || !canVote || isProcessingVote;
  let buttonText = 'Cast Your Vote';
  let buttonStyle = 'bg-accent-teal text-navy-primary hover:bg-accent-teal-dark focus:ring-accent-teal focus:ring-opacity-50 transform hover:scale-105';
  if (hasVoted) {
    buttonText = 'Your Vote!';
    buttonStyle = 'bg-green-500 text-white cursor-default';
  } else if (!canVote && !isProcessingVote) { // User has globally voted for someone else
    buttonText = 'Vote Cast';
    buttonStyle = 'bg-ui-neutral-light text-ui-neutral-medium cursor-not-allowed';
  } else if (isProcessingVote) { // Actual network request processing
    buttonText = 'Submitting Vote...';
    buttonStyle = 'bg-accent-teal text-navy-primary opacity-70 cursor-wait animate-pulse';
  }

  return (
    <article className={`bg-almost-white text-navy-primary bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform transition-all duration-300 hover:shadow-2xl ${!hasVoted && canVote ? 'hover:-translate-y-1' : ''} ${hasVoted ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-almost-white' : ''}`}>      <div className="h-52 sm:h-60 md:h-72 w-full overflow-hidden">
        {participant.picture_url ? (
          <img
            src={participant.picture_url}
            alt={`Photo of ${participant.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-ui-neutral-light flex items-center justify-center text-ui-neutral-medium">
            No Image
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-navy-primary mb-1.5">
            {participant.name}
          </h3>
          <p className="text-lg font-semibold text-accent-teal mb-2">
            Votes: <span className="font-bold">{voteCount}</span>
          </p>
          <div className="text-sm text-ui-neutral-dark mb-1">
            <span className="font-medium">Country:</span> {participant.country || 'N/A'}
          </div>
          <div className="text-sm text-ui-neutral-dark mb-3">
            <span className="font-medium">Age:</span> {participant.age || 'N/A'}
          </div>
          {participant.description && (
            <p className="text-sm text-ui-neutral-medium mb-4 leading-relaxed max-h-20 overflow-y-auto custom-scrollbar">
              {participant.description}
            </p>
          )}
        </div>

        <button
          onClick={handleVoteClick}
          disabled={buttonDisabled}
          className={`
            w-full mt-auto py-3 px-6 rounded-lg font-semibold text-lg
            transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 min-h-[48px]
            ${buttonStyle}
          `}
          style={{
            display:'flex',
            flexDirection:'row'
          }}
        >
          <MdOutlineFingerprint/>
          {buttonText}
        </button>
      </div>
    </article>
  );
};

export default ParticipantCard;