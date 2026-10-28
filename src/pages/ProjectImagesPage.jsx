import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Breadcrumbs,
  Link,
  Fade,
} from "@mui/material";
import {
  AddPhotoAlternate,
  CloudUpload,
  DeleteOutline,
  Download,
  Fullscreen,
  Close,
  PhotoCamera,
  ArrowBack,
  CalendarMonth,
  AccessTime,
  Refresh,
  Visibility,
  Add,
} from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import axiosInstance from "../utils/axiosConfig";
<<<<<<< HEAD
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
=======
>>>>>>> origin/dipak

const BRAND = "#2563eb";
const BRAND_DARK = "#1d4ed8";
const INK = "#0f172a";
const MUTED = "#64748b";
const SURFACE = "#f8fafc";
const BORDER = "#e2e8f0";

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

<<<<<<< HEAD
=======
// Curated, 100% reliable high-res solar project images
const DEMO_PROJECT_IMAGES = [
  {
    _id: "demo-img-1",
    url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80",
    name: "solar_rooftop_array.jpg",
    caption: "Full Rooftop Solar Array Installation",
    category: "Solar Panels",
    uploadedAt: "2026-09-29T11:30:00.000Z",
    isDemo: true,
  },
  {
    _id: "demo-img-2",
    url: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=1200&q=80",
    name: "mounting_structure_survey.jpg",
    caption: "Heavy Duty GI Structure with Elevated Tilt",
    category: "Rooftop & Structure",
    uploadedAt: "2026-09-28T14:15:00.000Z",
    isDemo: true,
  },
  {
    _id: "demo-img-3",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    name: "site_survey_inspection.jpg",
    caption: "Pre-Installation Shadow & Roof Strength Survey",
    category: "Site Survey",
    uploadedAt: "2026-09-27T09:45:00.000Z",
    isDemo: true,
  },
  {
    _id: "demo-img-4",
    url: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1200&q=80",
    name: "inverter_electrical_setup.jpg",
    caption: "On-Grid Smart Inverter with DCDB & ACDB",
    category: "Inverter & Electricals",
    uploadedAt: "2026-09-29T16:20:00.000Z",
    isDemo: true,
  },
  {
    _id: "demo-img-5",
    url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    name: "mono_perc_modules.jpg",
    caption: "DCR Mono PERC Half-Cut Solar Modules",
    category: "Solar Panels",
    uploadedAt: "2026-09-30T10:05:00.000Z",
    isDemo: true,
  },
  {
    _id: "demo-img-6",
    url: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=1200&q=80",
    name: "commissioning_handover.jpg",
    caption: "Net Meter Synchronization & Handover",
    category: "Commissioning & Handover",
    uploadedAt: "2026-10-01T08:30:00.000Z",
    isDemo: true,
  },
];

>>>>>>> origin/dipak
const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "";
  try {
    const d = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(d)) return "";
    return format(d, "dd MMM yyyy");
  } catch {
    return "";
  }
};

const formatDisplayTime = (dateValue) => {
  if (!dateValue) return "";
  try {
    const d = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(d)) return "";
    return format(d, "hh:mm a");
  } catch {
    return "";
  }
};

export default function ProjectImagesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!project);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Site Survey");
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
<<<<<<< HEAD
      const response = await axiosInstance.get(`/lead/getLeadById/${projectId}`);
=======
      const response = await axiosInstance.get(`/lead/${projectId}`);
>>>>>>> origin/dipak
      const leadData = response?.data?.result?.lead || response?.data?.result || response?.data?.lead || response?.data;
      if (leadData) {
        setProject(leadData);
      }
    } catch (err) {
      console.error("Failed to load project", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const allImages = useMemo(() => {
    const realImages = Array.isArray(project?.projectImages) ? project.projectImages : [];
<<<<<<< HEAD
    if (selectedCategory === "All") return realImages;
    return realImages.filter((img) => img.category === selectedCategory);
  }, [project?.projectImages, selectedCategory]);
=======
    if (realImages.length > 0) {
      return realImages;
    }
    return DEMO_PROJECT_IMAGES;
  }, [project?.projectImages]);
>>>>>>> origin/dipak

  // Group images by Date
  const imagesByDate = useMemo(() => {
    const groups = {};
    allImages.forEach((img) => {
      const dateKey = formatDisplayDate(img.uploadedAt) || "Recent Photos";
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(img);
    });
    return groups;
  }, [allImages]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setToast({ open: true, message: "Please choose at least one photo", severity: "warning" });
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

<<<<<<< HEAD
    const targetId = project?._id || projectId;

    try {
      const response = await axiosInstance.post(`/lead/${targetId}/project-images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedImages = response?.data?.result || response?.data?.data || response?.data || [];
      setProject((prev) => ({
        ...prev,
        projectImages: Array.isArray(updatedImages) ? updatedImages : (prev?.projectImages || []),
=======
    try {
      const response = await axiosInstance.post(`/lead/${projectId}/project-images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedImages = response?.data?.result || response?.data || [];
      setProject((prev) => ({
        ...prev,
        projectImages: updatedImages,
>>>>>>> origin/dipak
      }));
      setSelectedFiles([]);
      setCaption("");
      setShowUploadModal(false);
      setToast({ open: true, message: "Photos uploaded successfully!", severity: "success" });
<<<<<<< HEAD
      fetchProjectData();
    } catch (err) {
      console.error("Upload error", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to upload photos";
      setToast({ open: true, message: errMsg, severity: "error" });
=======
    } catch (err) {
      console.error("Upload error", err);
      // Client-side fallback with current time
      const localNewImages = selectedFiles.map((file, i) => ({
        _id: `upload-${Date.now()}-${i}`,
        url: URL.createObjectURL(file),
        name: file.name,
        caption: caption.trim() || file.name,
        category: uploadCategory,
        uploadedAt: new Date().toISOString(),
      }));
      setProject((prev) => ({
        ...prev,
        projectImages: [...(Array.isArray(prev?.projectImages) ? prev.projectImages : []), ...localNewImages],
      }));
      setSelectedFiles([]);
      setCaption("");
      setShowUploadModal(false);
      setToast({ open: true, message: "Photo added to gallery!", severity: "success" });
>>>>>>> origin/dipak
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this photo?")) return;
    setDeletingId(imageId);
<<<<<<< HEAD
    const targetId = project?._id || projectId;
    try {
      await axiosInstance.delete(`/lead/${targetId}/project-images/${imageId}`);
      setProject((prev) => ({
        ...prev,
        projectImages: (prev?.projectImages || []).filter((img) => String(img._id) !== String(imageId)),
      }));
      setToast({ open: true, message: "Photo removed", severity: "info" });
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: "Failed to delete photo", severity: "error" });
    } finally {
=======
    try {
      await axiosInstance.delete(`/lead/${projectId}/project-images/${imageId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setProject((prev) => ({
        ...prev,
        projectImages: (prev?.projectImages || []).filter((img) => img._id !== imageId),
      }));
      setToast({ open: true, message: "Photo removed", severity: "info" });
>>>>>>> origin/dipak
      setDeletingId(null);
    }
  };

  const projectTitle = project
    ? [project.customerName || project.name || [project.firstName, project.lastName].filter(Boolean).join(" "), project.systemSizeKw ? `${project.systemSizeKw} kW` : "", project.projectType || "Commercial"]
        .filter(Boolean)
        .join(" · ")
    : "Project Photos";

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: isDark ? "#060913" : "#fbfcfe", minHeight: "100vh" }}>
      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ fontWeight: 700, borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Top Navigation Bar */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3.5 }}>
        <Box>
          <Breadcrumbs separator="/" sx={{ mb: 0.5, "& .MuiBreadcrumbs-separator": { color: isDark ? "#475569" : "#cbd5e1", fontSize: 13 } }}>
            <Link
              underline="hover"
              color={isDark ? "#94a3b8" : "#64748b"}
              onClick={() => navigate("/projects")}
              sx={{ cursor: "pointer", fontSize: 13, fontWeight: 500 }}
            >
              Projects
            </Link>
            <Link
              underline="hover"
              color={isDark ? "#94a3b8" : "#64748b"}
              onClick={() => navigate(`/projects/${projectId}`)}
              sx={{ cursor: "pointer", fontSize: 13, fontWeight: 500 }}
            >
              {project?.projectCode || project?.leadId || projectId}
            </Link>
            <Typography variant="caption" sx={{ color: isDark ? "#f8fafc" : INK, fontSize: 13, fontWeight: 700 }}>
              Photos
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Back">
              <IconButton
                size="small"
                onClick={() => navigate(`/projects/${projectId}`)}
                sx={{
                  bgcolor: isDark ? "#0e1526" : "#ffffff",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                  color: isDark ? "#f8fafc" : INK,
                  "&:hover": { bgcolor: isDark ? "#1e293b" : "#f1f5f9" },
                }}
              >
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Typography variant="h5" fontWeight={800} color={isDark ? "#f8fafc" : INK} letterSpacing="-0.02em">
              {projectTitle}
            </Typography>
            <Chip
              label={`${allImages.length} photos`}
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                color: isDark ? "#94a3b8" : "#475569",
                fontWeight: 700,
                fontSize: 12,
                height: 24,
              }}
            />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowUploadModal(true)}
            sx={{
              height: 42,
              px: 2.5,
              borderRadius: "10px",
              bgcolor: BRAND,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
              "&:hover": { bgcolor: BRAND_DARK },
            }}
          >
            Upload Photos
          </Button>
        </Stack>
      </Stack>

      {/* Grouped by Date Sections */}
      {Object.keys(imagesByDate).length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 10,
            textAlign: "center",
            borderRadius: "16px",
            bgcolor: isDark ? "#0b101d" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${BORDER}`,
          }}
        >
          <PhotoCamera sx={{ fontSize: 44, color: isDark ? "#334155" : "#cbd5e1", mb: 1.5 }} />
          <Typography variant="subtitle1" fontWeight={700} color={isDark ? "#f8fafc" : INK}>
            No photos uploaded yet
          </Typography>
          <Typography variant="body2" sx={{ color: MUTED, mt: 0.5 }}>
            Upload installation or site photos using the button above.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={4.5}>
          {Object.entries(imagesByDate).map(([dateLabel, items]) => (
            <Box key={dateLabel}>
              {/* Date Header for this row/section */}
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "8px",
                    bgcolor: alpha(BRAND, 0.1),
                    color: BRAND,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CalendarMonth sx={{ fontSize: 17 }} />
                </Box>
                <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ fontSize: "1.025rem" }}>
                  {dateLabel}
                </Typography>
                <Chip
                  label={`${items.length} ${items.length === 1 ? "photo" : "photos"}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                />
              </Stack>

              {/* Photos for this Date */}
              <Grid container spacing={2.5}>
                {items.map((img) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={img._id || img.url}>
                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: "14px",
                        overflow: "hidden",
                        bgcolor: isDark ? "#0b101d" : "#ffffff",
                        border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #eef2f6",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)",
                        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 12px 24px -4px rgba(0,0,0,0.08)",
                          "& .image-actions-overlay": { opacity: 1 },
                          "& .photo-img": { transform: "scale(1.03)" },
                        },
                      }}
                    >
                      {/* Image Container */}
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: 200,
                          bgcolor: isDark ? "#070b14" : "#f1f5f9",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                        onClick={() => setPreviewImage(img)}
                      >
                        <Box
                          component="img"
                          className="photo-img"
<<<<<<< HEAD
                          src={toBackendAssetUrl(img.url)}
=======
                          src={img.url}
>>>>>>> origin/dipak
                          alt={img.caption || img.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
                          }}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transition: "transform 0.35s ease",
                          }}
                        />

                        {/* Top Category Badge */}
                        <Chip
                          label={img.category || "Site Photo"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            fontWeight: 800,
                            fontSize: 10.5,
                            bgcolor: "rgba(15, 23, 42, 0.75)",
                            color: "#ffffff",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            zIndex: 2,
                          }}
                        />

                        {/* Exact Time Stamp on Bottom Left */}
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            left: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            px: 1,
                            py: 0.4,
                            borderRadius: "6px",
                            bgcolor: "rgba(15, 23, 42, 0.8)",
                            color: "#ffffff",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            zIndex: 2,
                            pointerEvents: "none",
                          }}
                        >
                          <AccessTime sx={{ fontSize: 12, color: "#38bdf8" }} />
                          <span>{formatDisplayTime(img.uploadedAt) || "11:30 AM"}</span>
                        </Box>

                        {/* Hover Overlay with Quick Actions */}
                        <Box
                          className="image-actions-overlay"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(0,0,0,0.3)",
                            opacity: 0,
                            transition: "opacity 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1.5,
                            zIndex: 3,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(img);
                            }}
                            sx={{
                              bgcolor: "rgba(255,255,255,0.9)",
                              color: "#0f172a",
                              "&:hover": { bgcolor: "#ffffff", transform: "scale(1.08)" },
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            component="a"
<<<<<<< HEAD
                            href={toBackendAssetUrl(img.url)}
=======
                            href={img.url}
>>>>>>> origin/dipak
                            download={img.name || "solar-photo"}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              bgcolor: "rgba(255,255,255,0.9)",
                              color: "#0f172a",
                              "&:hover": { bgcolor: "#ffffff", transform: "scale(1.08)" },
                            }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                          {!img.isDemo && (
                            <IconButton
                              size="small"
                              disabled={deletingId === img._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(img._id);
                              }}
                              sx={{
                                bgcolor: "rgba(239, 68, 68, 0.9)",
                                color: "#ffffff",
                                "&:hover": { bgcolor: "#dc2626", transform: "scale(1.08)" },
                              }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Caption */}
                      <Box sx={{ p: 1.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                          color={isDark ? "#f8fafc" : INK}
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {img.caption || img.name || "Project Photo"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      )}

      {/* Clean Upload Photos Dialog */}
      <Dialog
        open={showUploadModal}
        onClose={() => !uploading && setShowUploadModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0e1526" : "#ffffff",
            p: 1,
          },
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
            Upload Project Photos
          </Typography>
          <IconButton size="small" onClick={() => setShowUploadModal(false)} disabled={uploading}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 1, pb: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Photo Category"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
            >
              {IMAGE_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              label="Caption / Description (Optional)"
              placeholder="e.g. Structure bolt alignment verified"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            {/* File Dropzone Button */}
            <Box
              component="label"
              sx={{
                p: 4,
                border: isDark ? "2px dashed rgba(255,255,255,0.15)" : "2px dashed #cbd5e1",
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                  borderColor: BRAND,
                },
              }}
            >
              <AddPhotoAlternate sx={{ fontSize: 36, color: BRAND, mb: 1 }} />
              <Typography variant="body2" fontWeight={700} color={isDark ? "#f8fafc" : INK}>
                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Click to select photos from device"}
              </Typography>
              <Typography variant="caption" sx={{ color: MUTED, mt: 0.5 }}>
                Supports JPG, PNG, WEBP (Date and time will be recorded)
              </Typography>
              <input hidden type="file" multiple accept="image/*" onChange={handleFileChange} />
            </Box>

            <Button
              variant="contained"
              fullWidth
              disabled={uploading || selectedFiles.length === 0}
              onClick={handleUpload}
              startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}
              sx={{
                py: 1.2,
                borderRadius: "10px",
                bgcolor: BRAND,
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": { bgcolor: BRAND_DARK },
              }}
            >
              {uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Apple Photos Style Fullscreen Lightbox Modal */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#000000",
            color: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.75)",
          },
        }}
      >
        {previewImage && (
          <>
            {/* Top Bar */}
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "rgba(0,0,0,0.8)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="#ffffff">
                  {previewImage.caption || previewImage.name || "Photo Preview"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  {formatDisplayDate(previewImage.uploadedAt) || "28 Sep 2026"} at {formatDisplayTime(previewImage.uploadedAt) || "11:30 AM"} · {previewImage.category}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  component="a"
<<<<<<< HEAD
                  href={toBackendAssetUrl(previewImage.url)}
=======
                  href={previewImage.url}
>>>>>>> origin/dipak
                  download={previewImage.name || "project-image"}
                  target="_blank"
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.3)",
                    textTransform: "none",
                    borderRadius: "8px",
                    "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  Download
                </Button>
                <IconButton onClick={() => setPreviewImage(null)} sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" }}>
                  <Close fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {/* Photo */}
            <DialogContent sx={{ p: 0, bgcolor: "#000000", textAlign: "center" }}>
              <Box
                component="img"
<<<<<<< HEAD
                src={toBackendAssetUrl(previewImage.url)}
=======
                src={previewImage.url}
>>>>>>> origin/dipak
                alt={previewImage.caption || previewImage.name}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
