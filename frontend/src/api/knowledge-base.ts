// Knowledge Base API - connects to Support Backend (port 8002)
import axios from 'axios';

const KB_API_BASE_URL = 'http://localhost:8002';
const KB_API_KEY = 'test-api-key-12345';

const kbClient = axios.create({
  baseURL: KB_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': KB_API_KEY,
  },
});

const knowledgeBaseApi = {
  getArticleSuggestions: async (limit = 10) => {
    try {
      const response = await kbClient.post('/api/knowledge-base/article-suggestions', { limit });
      return response.data?.data?.suggestions || [];
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },

  getTopDeflectableIssues: async (limit = 5, minTickets = 50) => {
    try {
      const response = await kbClient.post('/api/knowledge-base/top-deflectable-issues', {
        limit,
        min_tickets: minTickets,
      });
      return response.data?.data?.issues || [];
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },

  generateArticle: async (topic: string) => {
    try {
      const response = await kbClient.post('/api/knowledge-base/generate-article', { topic });
      return response.data;
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },

  listArticles: async (status?: string, limit = 50, offset = 0) => {
    try {
      const params: any = { limit, offset };
      if (status) params.status = status;

      const response = await kbClient.get('/api/knowledge-base/articles', { params });
      return response.data?.data?.articles || [];
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },

  getArticle: async (articleId: string) => {
    try {
      const response = await kbClient.get(`/api/knowledge-base/articles/${articleId}`);
      return response.data?.data;
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },

  updateArticle: async (articleId: string, updates: { title?: string; content?: string; status?: string }) => {
    try {
      const response = await kbClient.put(`/api/knowledge-base/articles/${articleId}`, updates);
      return response.data?.data;
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },

  deleteArticle: async (articleId: string) => {
    try {
      const response = await kbClient.delete(`/api/knowledge-base/articles/${articleId}`);
      return response.data?.data;
    } catch (error) {
      console.error('KB API Error:', error);
      throw error;
    }
  },
};

export default knowledgeBaseApi;
