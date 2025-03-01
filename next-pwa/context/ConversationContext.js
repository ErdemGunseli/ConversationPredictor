"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getConversations as getConversationsRequest,
  getConversation as getConversationRequest,
  createConversation as createConversationRequest,
  updateConversation as updateConversationRequest,
  deleteConversation as deleteConversationRequest
} from '../api/conversation';
import { useUser } from './UserContext';

const ConversationContext = createContext();

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // Load conversations when the user is logged in
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      // Clear conversations when user logs out
      setConversations([]);
      setCurrentConversation(null);
    }
  }, [user]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await getConversationsRequest();
      if (response) {
        setConversations(response);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConversation = async (conversationId) => {
    setIsLoading(true);
    try {
      const response = await getConversationRequest(conversationId);
      if (response) {
        setCurrentConversation(response);
        return response;
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const createConversation = async () => {
    setIsLoading(true);
    try {
      const response = await createConversationRequest();
      if (response) {
        // Add the new conversation to the list and set it as current
        setConversations([response, ...conversations]);
        setCurrentConversation(response);
        return response;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const updateConversation = async (conversationId, updateData, ai_insights = false) => {
    setIsLoading(true);
    try {
      const response = await updateConversationRequest(conversationId, updateData, ai_insights);
      if (response) {
        // Update the conversation in the list
        setConversations(
          conversations.map(conv => conv.id === conversationId ? response : conv)
        );
        
        // Update current conversation if it's the one being updated
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(response);
        }
        
        return response;
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // Helper specifically for updating transcript (uses the general update function)
  const updateConversationTranscript = async (conversationId, transcript, ai_insights = false) => {
    return await updateConversation(conversationId, { transcript }, ai_insights);
  };

  const deleteConversation = async (conversationId) => {
    setIsLoading(true);
    try {
      // Call the delete API but don't rely on the response
      await deleteConversationRequest(conversationId);
      
      // If we get here without an error, assume success and update UI
      // Remove the conversation from the list
      setConversations(conversations.filter(conv => conv.id !== conversationId));
      
      // Clear current conversation if it's the one being deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversation,
        isLoading,
        loadConversations,
        getConversation,
        createConversation,
        updateConversation,
        updateConversationTranscript,
        deleteConversation,
        setCurrentConversation
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => useContext(ConversationContext);

export default ConversationContext;
