import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Toast notifications via console
const useToast = () => ({
  toast: ({ title, description, variant }: any) => {
    console.log(`[${variant || 'info'}] ${title}: ${description}`);
  },
});
import { Loader2, Plus, Edit2, Trash2, Copy, Search, Filter } from 'lucide-react';


interface Template {
  id: number;
  name: string;
  description?: string;
  messageTemplate: string;
  category: 'maintenance' | 'payment' | 'announcement' | 'emergency' | 'other';
  variables?: string[];
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: '🔧 Maintenance',
  payment: '💰 Payment',
  announcement: '📢 Announcement',
  emergency: '🚨 Emergency',
  other: '📝 Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: '#4cc9f0',
  payment: '#4ade80',
  announcement: '#f59e0b',
  emergency: '#ef4444',
  other: '#7209b7',
};

export default function SMSTemplates() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    messageTemplate: string;
    category: 'maintenance' | 'payment' | 'announcement' | 'emergency' | 'other';
  }>({
    name: '',
    description: '',
    messageTemplate: '',
    category: 'announcement',
  });

  // Queries
  const { data: templates, isLoading, refetch } = trpc.smsTemplates.list.useQuery({
    category: selectedCategory || undefined,
    search: searchTerm || undefined,
  });

  const { data: categories } = trpc.smsTemplates.getCategories.useQuery();

  // Mutations
  const createMutation = trpc.smsTemplates.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = trpc.smsTemplates.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = trpc.smsTemplates.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const duplicateMutation = trpc.smsTemplates.duplicate.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template duplicated successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      messageTemplate: '',
      category: 'announcement' as const,
    });
    setEditingTemplate(null);
    setIsCreateOpen(false);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.messageTemplate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      messageTemplate: template.messageTemplate,
      category: template.category,
    });
    setEditingTemplate(template);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ id });
  };

  const characterCount = formData.messageTemplate.length;
  const characterLimit = 160;
  const isOverLimit = characterCount > characterLimit;

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates;
  }, [templates]);

  return (
    <div className="sms-templates-container">
      {/* Header */}
      <div className="sms-templates-header">
        <div>
          <h1 className="heading-xl gradient-text">SMS Templates</h1>
          <p className="text-muted mt-2">
            Save and manage reusable announcement messages
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="sms-templates-filters">
        <div className="filter-search">
          <Search className="w-4 h-4 text-white/50" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass"
          />
        </div>

        <div className="filter-category">
          <Filter className="w-4 h-4 text-white/50" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select-glass"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="sms-templates-grid">
        {isLoading ? (
          <div className="loading-state">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted mt-4">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3 className="heading-md mt-4">No templates yet</h3>
            <p className="text-muted mt-2">
              Create your first SMS template to get started
            </p>
          </div>
        ) : (
          filteredTemplates.map((template: Template) => (
            <Card key={template.id} className="template-card glass-card">
              <div className="template-header">
                <div className="template-category">
                  <span
                    className="category-badge"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[template.category]}20`,
                      borderColor: CATEGORY_COLORS[template.category],
                      color: CATEGORY_COLORS[template.category],
                    }}
                  >
                    {CATEGORY_LABELS[template.category]}
                  </span>
                </div>
                <div className="template-actions">
                  <button
                    onClick={() => handleEdit(template)}
                    className="action-btn"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className="action-btn"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="template-name">{template.name}</h3>
              {template.description && (
                <p className="template-description">{template.description}</p>
              )}

              <div className="template-message">
                <p>{template.messageTemplate}</p>
              </div>

              <div className="template-footer">
                <span className="character-count">
                  {template.messageTemplate.length}/160 chars
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="dialog-glass">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription className="text-muted">
              {editingTemplate
                ? 'Update your SMS template'
                : 'Create a new reusable SMS announcement template'}
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-form">
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <Input
                placeholder="e.g., Rent Reminder"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-glass"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <Input
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input-glass"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as any,
                  })
                }
                className="select-glass"
              >
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Message Template * ({characterCount}/{characterLimit})
              </label>
              <Textarea
                placeholder="Enter your SMS message (max 160 characters)"
                value={formData.messageTemplate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    messageTemplate: e.target.value.slice(0, 160),
                  })
                }
                className={`input-glass ${isOverLimit ? 'over-limit' : ''}`}
                rows={4}
              />
              {isOverLimit && (
                <p className="text-danger text-sm mt-2">
                  Message exceeds 160 character limit
                </p>
              )}
            </div>

            <div className="dialog-actions">
              <Button
                variant="outline"
                onClick={resetForm}
                className="btn-glass"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  isOverLimit
                }
                className="btn-primary-gradient"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
