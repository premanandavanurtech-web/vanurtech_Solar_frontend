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
  PictureAsPdfOutlined,
  DescriptionOutlined,
  OpenInNew,
  ImageNotSupportedOutlined,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosConfig";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import { extractAllProjectMedia } from "../utils/projectMediaExtractor";

const INDIGO = "#6366f1";
const BLUE = "#3b82f6";
const BRAND = "#2563eb";

const UPLOAD_CATEGORIES = [
  "Site Survey",
  "Rooftop & Structure",
  "Solar Panels",
  "Inverter & Electricals",
  "Net Meter & DISCOM",
  "Commissioning & Handover",
  "Other",
];

function WorkspaceImageThumbnail({ item, assetUrl, isDark, onPreview }) {
  const [loadError, setLoadError] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        height: 180,
        bgcolor: isDark ? "#070b14" : "#000",
        cursor: "pointer",
        overflow: "hidden",
      }}
      onClick={() => onPreview(item)}
    >
      {loadError ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            textAlign: "center",
            bgcolor: isDark ? "#090d18" : "#f8fafc",
            color: isDark ? "#64748b" : "#94a3b8",
          }}
        >
          <ImageNotSupportedOutlined sx={{ fontSize: 32, mb: 0.5, color: isDark ? "#475569" : "#cbd5e1" }} />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.74rem", color: isDark ? "#94a3b8" : "#64748b" }}>
            File Not on Server (404)
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.65rem", opacity: 0.75, maxWidth: 170 }}>
            File removed during server restart
          </Typography>
        </Box>
      ) : (
        <Box
          component="img"
          src={assetUrl}
          alt={item.caption || item.name}
          onError={() => setLoadError(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s",
            "&:hover": { transform: "scale(1.05)" },
          }}
        />
      )}
      <Chip
        label={item.category || "Site Photo"}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          fontWeight: 800,
          fontSize: 10,
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
  );
}

export default function ProjectImagesWorkspace({ project, onUpdate }) {
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

  // Extract ALL media across project lifecycle (Survey, KYC, Installation, Meter, DCR, etc.)
  const allMedia = useMemo(() => {
    return extractAllProjectMedia(project);
  }, [project]);

  const photosCount = useMemo(() => allMedia.filter((m) => m.isImage).length, [allMedia]);
  const docsCount = useMemo(() => allMedia.filter((m) => !m.isImage).length, [allMedia]);

  const availableCategories = useMemo(() => {
    const cats = new Set();
    allMedia.forEach((m) => {
      if (m.category) cats.add(m.category);
    });
    const list = ["All"];
    if (photosCount > 0 && docsCount > 0) {
      list.push("Photos Only");
      list.push("Documents Only");
    }
    cats.forEach((c) => list.push(c));
    return list;
  }, [allMedia, photosCount, docsCount]);

  const filteredMedia = useMemo(() => {
    if (selectedCategoryFilter === "All") return allMedia;
    if (selectedCategoryFilter === "Photos Only") return allMedia.filter((m) => m.isImage);
    if (selectedCategoryFilter === "Documents Only") return allMedia.filter((m) => !m.isImage);
    return allMedia.filter((m) => m.category === selectedCategoryFilter);
  }, [allMedia, selectedCategoryFilter]);

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
              {UPLOAD_CATEGORIES.map((cat) => (
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
            />
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
                Project Photos & Completion Documents ({filteredMedia.length})
              </Typography>
            </Stack>

            {/* Category Filter Chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {availableCategories.map((cat) => (
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

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Collections sx={{ fontSize: 48, color: isDark ? "#475569" : "#cbd5e1", mb: 1.5 }} />
            <Typography variant="body1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
              No Files in this Category
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Upload site, installation, and inspection photos, or complete project stages to view documents here.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              {filteredMedia.map((item) => {
                const assetUrl = toBackendAssetUrl(item.url);
                const isImage = item.isImage;
                const isPdf = item.isPdf;

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id || item._id || item.url}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2.5,
                        overflow: "hidden",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                        bgcolor: isDark ? "#070b14" : "#ffffff",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      {isImage ? (
                        /* Image Preview Container */
                        <WorkspaceImageThumbnail
                          item={item}
                          assetUrl={assetUrl}
                          isDark={isDark}
                          onPreview={setPreviewImage}
                        />
                      ) : (
                        /* Document Preview Container */
                        <Box
                          sx={{
                            height: 180,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            bgcolor: isDark ? "#090d18" : "#f8fafc",
                            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={item.category || "Document"}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: 10,
                                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                                color: isDark ? "#cbd5e1" : "#475569",
                              }}
                            />
                            {item.stage && (
                              <Chip
                                label={item.stage}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 9,
                                  bgcolor: alpha(BRAND, 0.15),
                                  color: BRAND,
                                  maxWidth: 120,
                                }}
                              />
                            )}
                          </Stack>

                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isPdf ? alpha("#ef4444", 0.12) : alpha(BRAND, 0.12),
                                color: isPdf ? "#ef4444" : BRAND,
                                flexShrink: 0,
                              }}
                            >
                              {isPdf ? <PictureAsPdfOutlined sx={{ fontSize: 24 }} /> : <DescriptionOutlined sx={{ fontSize: 24 }} />}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Tooltip title={item.name || "Document"}>
                                <Typography
                                  variant="body2"
                                  fontWeight={800}
                                  sx={{
                                    color: isDark ? "#f8fafc" : "#0f172a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.name || "Document"}
                                </Typography>
                              </Tooltip>
                              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                                {isPdf ? "PDF Document" : "File"}
                              </Typography>
                            </Box>
                          </Stack>

                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            component="a"
                            href={assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                            sx={{
                              height: 30,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                            }}
                          >
                            Open File
                          </Button>
                        </Box>
                      )}

                      {/* Info & Actions Footer */}
                      <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            noWrap
                            sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.3 }}
                          >
                            {item.caption || item.name || "Project Item"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                            {item.stage || item.category || ""}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              component="a"
                              href={assetUrl}
                              download={item.name || "project-file"}
                              target="_blank"
                              sx={{ color: isDark ? "#60a5fa" : BLUE }}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {item.canDelete && (
                            <Tooltip title="Delete Photo">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={deletingId === item._id}
                                  onClick={() => handleDeleteImage(item._id)}
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
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
                Category: {previewImage.category} {previewImage.stage ? `• ${previewImage.stage}` : ""} • Uploaded on{" "}
                {previewImage.uploadedAt ? new Date(previewImage.uploadedAt).toLocaleString() : ""}
              </Typography>
            </Box>
          )}
        </Box>
      </Dialog>
    </Stack>
  );
}
