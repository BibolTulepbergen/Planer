import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTasks } from '../context/TasksContext';
import { TagDialog } from '../components/Tags/TagDialog';
import type { Tag, CreateTagRequest, UpdateTagRequest } from '../types';

export const TagsPage = () => {
  const { tags, tagsLoading, createTag, updateTag, deleteTag } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTag = () => {
    setSelectedTag(null);
    setDialogOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setSelectedTag(tag);
    setDialogOpen(true);
  };

  const handleDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (tagToDelete) {
      try {
        setError(null);
        await deleteTag(tagToDelete.id);
        setDeleteDialogOpen(false);
        setTagToDelete(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка при удалении тега';
        setError(message);
      }
    }
  };

  const handleSaveTag = async (data: CreateTagRequest | UpdateTagRequest) => {
    try {
      setError(null);
      if (selectedTag) {
        await updateTag(selectedTag.id, data as UpdateTagRequest);
      } else {
        await createTag(data as CreateTagRequest);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при сохранении тега';
      setError(message);
      throw err;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Управление тегами</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTag}>
          Создать тег
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Теги помогают организовать и фильтровать ваши задачи. Создайте теги для разных категорий:
        работа, дом, здоровье, учёба и т.д.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tagsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tags.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            У вас пока нет тегов
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Создайте первый тег для организации ваших задач
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTag}>
            Создать первый тег
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={tag.name}
                    sx={{
                      bgcolor: tag.color,
                      color: 'white',
                      flex: 1,
                      fontSize: '1rem',
                      height: 40,
                    }}
                  />
                  <Box>
                    <IconButton size="small" onClick={() => handleEditTag(tag)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteTag(tag)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Создан: {new Date(tag.created_at).toLocaleDateString('ru-RU')}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tag Dialog */}
      <TagDialog
        open={dialogOpen}
        tag={selectedTag}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTag}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить тег?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Тег "{tagToDelete?.name}" будет удалён. Он будет убран из всех задач, где использовался.
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

