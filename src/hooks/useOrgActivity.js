import { useQuery, useQueryClient } from '@tanstack/react-query';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { useEffect } from 'react';

/**
 * Hook: useOrgActivity
 * Real-time org-scoped activity feed using React Query + Base44 subscriptions
 * Replaces Firebase Firestore listeners with Base44's entity subscriptions
 */
export function useOrgActivity(orgId, memberType = 'INSTRUCTOR') {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', orgId],
    queryFn: async () => {
      // Fetch all tasks for the org
      return base44.entities.Task.list('-created_date', 50);
    },
    staleTime: 5000,
    refetchInterval: 10000, // Poll every 10s for updates
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', orgId],
    queryFn: async () => {
      return base44.entities.InstructorAssignment.filter({ org_id: orgId });
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', orgId],
    queryFn: async () => {
      return base44.entities.Message.list('-created_date', 100);
    },
    staleTime: 3000,
    refetchInterval: 5000,
  });

  // Subscribe to real-time task changes
  useEffect(() => {
    const unsubscribe = base44.entities.Task.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      }
    });
    return unsubscribe;
  }, [orgId, queryClient]);

  // Subscribe to real-time assignment changes
  useEffect(() => {
    const unsubscribe = base44.entities.InstructorAssignment.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', orgId] });
    });
    return unsubscribe;
  }, [orgId, queryClient]);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['messages', orgId] });
    });
    return unsubscribe;
  }, [orgId, queryClient]);

  // Aggregate pending reviews (tasks submitted but not yet reviewed)
  const pendingReviews = tasks.filter(
    (t) => t.status === 'Submitted' && t.coach_email
  );

  // Filter assignments for current instructor
  const myAssignments = assignments.filter(
    (a) => a.assigned_to && a.status !== 'completed'
  );

  return {
    tasks,
    assignments,
    messages,
    pendingReviews,
    myAssignments,
    isLoading,
    refetch: () => {
      queryClient.refetchQueries({ queryKey: ['tasks', orgId] });
      queryClient.refetchQueries({ queryKey: ['assignments', orgId] });
      queryClient.refetchQueries({ queryKey: ['messages', orgId] });
    },
  };
}