'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentUploader({ onSuccess, relatedEntityType, relatedEntityId }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    fileName: '',
    fileUrl: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: formData.documentType,
          file_name: formData.fileName,
          file_url: formData.fileUrl,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
        }),
      });

      if (!response.ok) throw new Error('Failed to upload document');

      toast.success('Document uploaded successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <Select
          value={formData.documentType}
          onValueChange={(value) => setFormData({ ...formData, documentType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Inspection Report">Inspection Report</SelectItem>
            <SelectItem value="Compliance Certificate">Compliance Certificate</SelectItem>
            <SelectItem value="Service Record">Service Record</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileName">File Name</Label>
        <Input
          id="fileName"
          value={formData.fileName}
          onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
          placeholder="document.pdf"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileUrl">File URL</Label>
        <Input
          id="fileUrl"
          value={formData.fileUrl}
          onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
          placeholder="https://..."
          required
        />
        <p className="text-xs text-slate-500">
          Enter the URL where the document is stored (e.g., cloud storage link)
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>
    </form>
  );
}