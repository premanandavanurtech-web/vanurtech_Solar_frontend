import React, { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme,
  alpha,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  AddPhotoAlternate,
  CloudUpload,
  DeleteOutline,
  Download,
  Fullscreen,
  Close,
  Collections,
  PhotoCamera,
  FilterList,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosConfig";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";

const INDIGO = "#6366f1";
const BLUE = "#3b82f6";
const SUCCESS = "#10b981";
const DANGER = "#ef4444";

const IMAGE_CATEGORIES = [
  "All",
  "Site Survey",
  "Rooftop & Structure",
  "Solar Panels",
  "Inverter & Electricals",
  "Net Meter & DISCOM",
  "Commissioning & Handover",
  "Other",
];

export default function ProjectImagesWorkspace({
  project,
  onUpdate,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [uploadCategory, setUploadCategory] = useState("Site Survey");
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Lightbox Preview State
  const [previewImage, setPreviewImage] = useState(null);

  // Toast
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const projectImages = useMemo(() => {
    return Array.isArray(project?.projectImages) ? project.projectImages : [];
  }, [project]);

  const filteredImages = useMemo(() => {
    if (selectedCategoryFilter === "All") return projectImages;
    return projectImages.filter((img) => img.category === selectedCategoryFilter);
  }, [projectImages, selectedCategoryFilter]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setToast({ open: true, message: "Please choose at least one photo to upload.", severity: "warning" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("category", uploadCategory);
    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }

    try {
      const response = await axiosInstance.post(`/lead/${project._id}/project-images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedImages = response?.data?.result || response?.data || [];
      if (onUpdate) {
        onUpdate({
          ...project,
          projectImages: updatedImages,
        });
      }
      setSelectedFiles([]);
      setCaption("");
      setToast({ open: true, message: "Project photo(s) uploaded successfully!", severity: "success" });
    } catch (err) {
      console.error("Failed to upload project images", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to upload photos.";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this photo from project images?")) return;
    setDeletingId(imageId);
    try {
      const response = await axiosInstance.delete(`/lead/${project._id}/project-images/${imageId}`);
      const updatedImages = response?.data?.result || response?.data || [];
      if (onUpdate) {
        onUpdate({
          ...project,
          projectImages: updatedImages,
        });
      }
      setToast({ open: true, message: "Photo deleted successfully.", severity: "success" });
    } catch (err) {
      console.error("Failed to delete image", err);
      setToast({ open: true, message: "Failed to delete photo.", severity: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} variant="filled" sx={{ width: "100%", fontWeight: 700, borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Upload New Project Photos Box */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: isDark ? "#0b1220" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(INDIGO, 0.12),
              color: INDIGO,
            }}
          >
            <PhotoCamera />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
              Upload Project Photos
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Upload site surveys, rooftop structures, panels, inverters, meters, and completion photos
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Photo Category"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              sx={{ bgcolor: isDark ? "#070b14" : "#ffffff", borderRadius: 2 }}
            >
              {IMAGE_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Caption / Note (Optional)"
              placeholder="e.g. Structure bolt torque verified"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              sx={{ bgcolor: isDark ? "#070b14" : "#ffffff", borderRadius: 2 }}
            >
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<AddPhotoAlternate />}
              sx={{
                py: 1,
                borderRadius: 2,
                fontWeight: 800,
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1",
                color: isDark ? "#f8fafc" : "#1e293b",
              }}
            >
              {selectedFiles.length > 0 ? `${selectedFiles.length} Photo(s) Selected` : "Choose Photos"}
              <input hidden type="file" multiple accept="image/*" onChange={handleFileChange} />
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              fullWidth
              disabled={uploading || selectedFiles.length === 0}
              onClick={handleUpload}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
              sx={{
                py: 1,
                bgcolor: INDIGO,
                color: "#ffffff",
                fontWeight: 900,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Gallery Header & Category Filters */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: isDark ? "#0b1220" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Collections sx={{ color: isDark ? "#60a5fa" : BLUE }} />
              <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                Project Photo Gallery ({filteredImages.length})
              </Typography>
            </Stack>

            {/* Category Filter Chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {IMAGE_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  clickable
                  onClick={() => setSelectedCategoryFilter(cat)}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: 12,
                    bgcolor: selectedCategoryFilter === cat ? INDIGO : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                    color: selectedCategoryFilter === cat ? "#ffffff" : isDark ? "#cbd5e1" : "#475569",
                    "&:hover": { bgcolor: selectedCategoryFilter === cat ? INDIGO : isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* Photos Grid */}
        {filteredImages.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Collections sx={{ fontSize: 48, color: isDark ? "#475569" : "#cbd5e1", mb: 1.5 }} />
            <Typography variant="body1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
              No Project Photos in this Category
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Upload site, installation, and inspection photos using the upload tool above.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              {filteredImages.map((img) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={img._id || img.url}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2.5,
                      overflow: "hidden",
                      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                      bgcolor: isDark ? "#070b14" : "#ffffff",
                      position: "relative",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    {/* Image Preview Container */}
                    <Box
                      sx={{
                        position: "relative",
                        height: 180,
                        bgcolor: "#000",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                      onClick={() => setPreviewImage(img)}
                    >
                      <Box
                        component="img"
                        src={toBackendAssetUrl(img.url)}
                        alt={img.caption || img.name}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
                        }}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s",
                          "&:hover": { transform: "scale(1.05)" },
                        }}
                      />
                      <Chip
                        label={img.category || "Site Photo"}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          fontWeight: 800,
                          fontSize: 10.5,
                          bgcolor: "rgba(0,0,0,0.65)",
                          color: "#ffffff",
                          backdropFilter: "blur(4px)",
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "#ffffff",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                        }}
                      >
                        <Fullscreen fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Image Info & Actions */}
                    <Box sx={{ p: 1.5 }}>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        noWrap
                        sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.3 }}
                      >
                        {img.caption || img.name || "Project Photo"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", mb: 1 }}>
                        {img.uploadedAt ? new Date(img.uploadedAt).toLocaleDateString() : ""}
                      </Typography>

                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Download Image">
                          <IconButton
                            size="small"
                            component="a"
                            href={img.url}
                            download={img.name || "project-image"}
                            target="_blank"
                            sx={{ color: isDark ? "#60a5fa" : BLUE }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Photo">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={deletingId === img._id}
                              onClick={() => handleDeleteImage(img._id)}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Lightbox / Fullscreen Image Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "#000",
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ position: "relative", textAlign: "center", bgcolor: "#000", p: 1 }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              zIndex: 10,
              "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
            }}
          >
            <Close />
          </IconButton>
          {previewImage && (
            <Box
              component="img"
              src={toBackendAssetUrl(previewImage.url)}
              alt={previewImage.caption || previewImage.name}
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
              }}
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 2,
              }}
            />
          )}
          {previewImage && (
            <Box sx={{ p: 1.5, textAlign: "left", color: "#ffffff" }}>
              <Typography variant="subtitle1" fontWeight={800}>
                {previewImage.caption || previewImage.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Category: {previewImage.category} • Uploaded on {previewImage.uploadedAt ? new Date(previewImage.uploadedAt).toLocaleString() : ""}
              </Typography>
            </Box>
          )}
        </Box>
      </Dialog>
    </Stack>
  );
}
