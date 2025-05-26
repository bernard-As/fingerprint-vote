// src/pages/AdminDashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Participant, ParticipantFormData } from '../lib/types';
import {
  getParticipants,
  addParticipant,
  updateParticipant,
  deleteParticipant,
} from '../services/participantService';
import { logoutAdmin, getCurrentUser } from '../services/authService'; // Assuming you have these

// Basic Modal Component (can be extracted to src/components/ui/Modal.tsx)
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-opacity-75 transition-opacity flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-ui-neutral hover:text-ui-neutral-dark p-1"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-2xl font-semibold text-navy-primary mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};


const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const initialFormState: ParticipantFormData = { name: '', picture_url: '', country: '', age: '', description: '' };
  const [formState, setFormState] = useState<ParticipantFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchParticipantsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await getParticipants();
    if (fetchError) {
      setError(fetchError.message || 'Failed to load participants.');
      console.error("Fetch error:", fetchError);
    } else if (data) {
      setParticipants(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Check if user is authenticated as admin
    const checkAuth = async () => {
      const { user, error: authError } = await getCurrentUser();
      if (authError || !user) {
        console.log("Not authenticated or error fetching user, redirecting to login.");
        navigate('/admin/login'); // Redirect if not logged in
      } else {
        fetchParticipantsData();
      }
    };
    checkAuth();
  }, [navigate, fetchParticipantsData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingParticipant(null);
    setFormState(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormState({
          name: participant.name,
          picture_url: participant.picture_url,
          country: participant.country,
          age: participant.age.toString(), // Convert number to string for input
          description: participant.description || '',
        });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParticipant(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const ageNumber = parseInt(formState.age, 10);
    if (isNaN(ageNumber) || ageNumber <= 0) {
      setFormError("Please enter a valid age.");
      setIsSubmitting(false);
      return;
    }
    if (!formState.name.trim()) {
        setFormError("Name is required.");
        setIsSubmitting(false);
        return;
    }

    const participantDataPayload = {
      name: formState.name.trim(),
      picture_url: formState.picture_url.trim(),
      country: formState.country.trim(),
      age: ageNumber,
      description: formState.description.trim() ? formState.description.trim() : undefined,
    };

    try {
      if (editingParticipant) {
        const { data, error: updateError } = await updateParticipant(editingParticipant.id, participantDataPayload);
        if (updateError) throw updateError;
        if (data) {
          setParticipants(prev => prev.map(p => (p.id === data.id ? data : p)));
        }
      } else {
        const { data, error: addError } = await addParticipant(participantDataPayload);
        if (addError) throw addError;
        if (data) {
          setParticipants(prev => [data, ...prev]);
        }
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || `Failed to ${editingParticipant ? 'update' : 'add'} participant.`);
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this participant?')) {
      setIsSubmitting(true); // Can use a different loading state if preferred
      const { error: deleteError } = await deleteParticipant(id);
      if (deleteError) {
        setError(deleteError.message || 'Failed to delete participant.');
        console.error("Delete error:", deleteError);
      } else {
        setParticipants(prev => prev.filter(p => p.id !== id));
      }
      setIsSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login');
  };

  // Input field styles
  const inputStyles = "mt-1 block w-full px-3 py-2.5 bg-almost-white border border-ui-neutral-light rounded-md shadow-sm focus:outline-none focus:ring-accent-teal focus:border-accent-teal sm:text-sm text-navy-primary min-h-[44px]";
  const labelStyles = "block text-sm font-medium text-ui-neutral-dark";

  if (isLoading && !participants.length) { // Show full page loader only on initial load
    return <div className="min-h-screen flex items-center justify-center bg-navy-primary text-neutral-light-text"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray text-neutral-light-text p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleAdminLogout}
          className="bg-accent-teal text-navy-primary font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-accent-teal-dark transition-colors min-h-[44px]"
        >
          Logout
        </button>
      </header>

      <div className="mb-6">
        <button
          onClick={openAddModal}
          className="bg-accent-teal text-navy-primary font-semibold py-2.5 px-6 rounded-lg shadow-md hover:bg-accent-teal-dark transition-colors min-h-[48px]"
        >
          + Add New Participant
        </button>
      </div>

      {error && <p className="mb-4 text-status-error bg-status-error-light p-3 rounded-md">{error}</p>}

      {isLoading && participants.length > 0 && <p className="text-center my-4">Refreshing participants...</p>}

      {/* Participants List/Table */}
      <div className="bg-almost-white text-navy-primary rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-ui-neutral-light text-left">
            <tr>
              <th className="p-3 sm:p-4 font-semibold">Picture</th>
              <th className="p-3 sm:p-4 font-semibold">Name</th>
              <th className="p-3 sm:p-4 font-semibold">Country</th>
              <th className="p-3 sm:p-4 font-semibold">Age</th>
              <th className="p-3 sm:p-4 font-semibold w-1/4">Description</th>
              <th className="p-3 sm:p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-ui-neutral-medium">
                  No participants found. Add one to get started!
                </td>
              </tr>
            )}
            {participants.map(participant => (
              <tr key={participant.id} className="border-b border-ui-neutral-light last:border-b-0 hover:bg-navy-primary hover:bg-opacity-5 transition-colors">
                <td className="p-3 sm:p-4 align-middle">
                  {participant.picture_url ? (
                    <img
                      src={participant.picture_url}
                      alt={participant.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover bg-ui-neutral-light"
                      onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-ui-neutral-light flex items-center justify-center text-ui-neutral-medium text-xs">
                      No Image
                    </div>
                  )}
                </td>
                <td className="p-3 sm:p-4 font-medium align-middle">{participant.name}</td>
                <td className="p-3 sm:p-4 text-ui-neutral-dark align-middle">{participant.country || 'N/A'}</td>
                <td className="p-3 sm:p-4 text-ui-neutral-dark align-middle">{participant.age || 'N/A'}</td>
                <td className="p-3 sm:p-4 text-ui-neutral-dark align-middle text-sm"> {/* <-- ADDED TD */}
                  {participant.description ? (
                     participant.description.length > 100 ? `${participant.description.substring(0, 97)}...` : participant.description
                  ) : (
                    <span className="italic">No description</span>
                  )}
                </td>
                <td className="p-3 sm:p-4 text-right align-middle space-x-2">
                  <button
                    onClick={() => openEditModal(participant)}
                    className="text-accent-teal hover:text-accent-teal-dark font-medium py-1 px-2 rounded hover:bg-accent-teal hover:bg-opacity-10 transition-colors"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(participant.id)}
                    disabled={isSubmitting}
                    className="text-status-error hover:text-status-error-dark font-medium py-1 px-2 rounded hover:bg-status-error hover:bg-opacity-10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingParticipant ? 'Edit Participant' : 'Add New Participant'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="text-sm text-status-error bg-status-error-light p-2.5 rounded-md text-center">{formError}</p>}
          <div>
            <label htmlFor="name" className={labelStyles}>Name <span className="text-status-error">*</span></label>
            <input type="text" name="name" id="name" value={formState.name} onChange={handleInputChange} className={inputStyles} required />
          </div>
          <div>
            <label htmlFor="picture_url" className={labelStyles}>Picture URL</label>
            <input type="url" name="picture_url" id="picture_url" value={formState.picture_url} onChange={handleInputChange} className={inputStyles} placeholder="https://example.com/image.jpg" />
          </div>
          <div>
            <label htmlFor="country" className={labelStyles}>Country</label>
            <input type="text" name="country" id="country" value={formState.country} onChange={handleInputChange} className={inputStyles} />
          </div>
          <div>
            <label htmlFor="age" className={labelStyles}>Age <span className="text-status-error">*</span></label>
            <input type="number" name="age" id="age" value={formState.age} onChange={handleInputChange} className={inputStyles} required min="1"/>
          </div>
          <div>
            <label htmlFor="description" className={labelStyles}>Description</label>
            <textarea
              name="description"
              id="description"
              value={formState.description}
              onChange={handleInputChange}
              className={`${inputStyles} min-h-[80px]`} // Basic textarea styling
              rows={3}
              placeholder="A short description of the participant..."
            />
          </div>
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 border border-ui-neutral-light text-ui-neutral-dark rounded-lg hover:bg-ui-neutral-light hover:bg-opacity-50 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-navy-primary text-neutral-light-text rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-60 min-h-[44px]"
            >
              {isSubmitting ? 'Saving...' : (editingParticipant ? 'Save Changes' : 'Add Participant')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;