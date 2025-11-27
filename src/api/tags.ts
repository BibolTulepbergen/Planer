import { api } from '../utils/api';
import type { Tag, CreateTagRequest, UpdateTagRequest, ApiResponse } from '../types';

/**
 * Get all tags for current user
 */
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get<ApiResponse<Tag[]>>('/tags');
  return response.data || [];
};

/**
 * Get single tag by ID
 */
export const getTag = async (id: number): Promise<Tag> => {
  const response = await api.get<ApiResponse<Tag>>(`/tags/${id}`);
  if (!response.data) {
    throw new Error('Tag not found');
  }
  return response.data;
};

/**
 * Create new tag
 */
export const createTag = async (data: CreateTagRequest): Promise<Tag> => {
  const response = await api.post<ApiResponse<Tag>>('/tags', data);
  if (!response.data) {
    throw new Error('Failed to create tag');
  }
  return response.data;
};

/**
 * Update tag
 */
export const updateTag = async (id: number, data: UpdateTagRequest): Promise<Tag> => {
  const response = await api.patch<ApiResponse<Tag>>(`/tags/${id}`, data);
  if (!response.data) {
    throw new Error('Failed to update tag');
  }
  return response.data;
};

/**
 * Delete tag
 */
export const deleteTag = async (id: number): Promise<void> => {
  await api.delete<ApiResponse>(`/tags/${id}`);
};

