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
  Card,
  CardActionArea,
  Divider,
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
  PictureAsPdfOutlined,
  InsertDriveFileOutlined,
  DescriptionOutlined,
  OpenInNew,
  CheckCircleOutlined,
  FolderOpen,
  ImageNotSupportedOutlined,
} from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";
import axiosInstance from "../utils/axiosConfig";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import { extractAllProjectMedia } from "../utils/projectMediaExtractor";

const BRAND = "#2563eb";
const BRAND_DARK = "#1d4ed8";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const UPLOAD_CATEGORIES = [
  "Site Survey",
  "Rooftop & Structure",
  "Solar Panels",
  "Inverter & Electricals",
  "Net Meter & DISCOM",
  "Commissioning & Handover",
  "Other",
];

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

function ProjectImageThumbnail({ item, assetUrl, isDark, onPreview, onDelete, deletingId }) {
  const [loadError, setLoadError] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 195,
        bgcolor: isDark ? "#070b14" : "#f1f5f9",
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
          <ImageNotSupportedOutlined sx={{ fontSize: 36, mb: 0.75, color: isDark ? "#475569" : "#cbd5e1" }} />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.76rem", color: isDark ? "#94a3b8" : "#64748b" }}>
            File Not on Server (404)
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.68rem", opacity: 0.75, maxWidth: 180, mt: 0.2 }}>
            File removed during server restart
          </Typography>
        </Box>
      ) : (
        <Box
          component="img"
          className="photo-img"
          src={assetUrl}
          alt={item.caption || item.name}
          loading="lazy"
          onError={() => setLoadError(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.35s ease",
          }}
        />
      )}

      {/* Top Left: Category Badge */}
      <Chip
        label={item.category || "Site Photo"}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          fontWeight: 800,
          fontSize: 10,
          bgcolor: "rgba(15, 23, 42, 0.78)",
          color: "#ffffff",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          zIndex: 2,
        }}
      />

      {/* Top Right: Stage Badge */}
      {item.stage && (
        <Chip
          label={item.stage}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            fontWeight: 700,
            fontSize: 9.5,
            bgcolor: "rgba(37, 99, 235, 0.85)",
            color: "#ffffff",
            backdropFilter: "blur(6px)",
            zIndex: 2,
            maxWidth: 130,
          }}
        />
      )}

      {/* Timestamp on Bottom Left */}
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          left: 8,
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          px: 1,
          py: 0.3,
          borderRadius: "6px",
          bgcolor: "rgba(15, 23, 42, 0.8)",
          color: "#ffffff",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          fontSize: "0.7rem",
          fontWeight: 700,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <AccessTime sx={{ fontSize: 12, color: "#38bdf8" }} />
        <span>{formatDisplayTime(item.uploadedAt) || "12:00 PM"}</span>
      </Box>

      {/* Hover Overlay with Quick Actions */}
      <Box
        className="image-actions-overlay"
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.35)",
          opacity: 0,
          transition: "opacity 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.25,
          zIndex: 3,
        }}
      >
        {!loadError && (
          <Tooltip title="Preview">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(item);
              }}
              sx={{
                bgcolor: "rgba(255,255,255,0.92)",
                color: "#0f172a",
                "&:hover": { bgcolor: "#ffffff", transform: "scale(1.08)" },
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Download">
          <IconButton
            size="small"
            component="a"
            href={assetUrl}
            download={item.name || "solar-photo"}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            sx={{
              bgcolor: "rgba(255,255,255,0.92)",
              color: "#0f172a",
              "&:hover": { bgcolor: "#ffffff", transform: "scale(1.08)" },
            }}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>

        {item.canDelete && (
          <Tooltip title="Delete Photo">
            <IconButton
              size="small"
              disabled={deletingId === item._id}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item._id);
              }}
              sx={{
                bgcolor: "rgba(239, 68, 68, 0.92)",
                color: "#ffffff",
                "&:hover": { bgcolor: "#dc2626", transform: "scale(1.08)" },
              }}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

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
      const response = await axiosInstance.get(`/lead/getLeadById/${projectId}`);
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

  // Extract ALL images and documents uploaded throughout the project completion workflow
  const allProjectMedia = useMemo(() => {
    return extractAllProjectMedia(project);
  }, [project]);

  const photosCount = useMemo(() => allProjectMedia.filter((m) => m.isImage).length, [allProjectMedia]);
  const docsCount = useMemo(() => allProjectMedia.filter((m) => !m.isImage).length, [allProjectMedia]);

  // Dynamic category options based on actual files present in the project
  const categoryFilters = useMemo(() => {
    const catCounts = {};
    allProjectMedia.forEach((m) => {
      const c = m.category || "General";
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    const filters = [
      { id: "All", label: "All Files", count: allProjectMedia.length },
    ];
    if (photosCount > 0 && docsCount > 0) {
      filters.push({ id: "Photos Only", label: "Photos", count: photosCount });
      filters.push({ id: "Documents Only", label: "Documents", count: docsCount });
    }

    Object.entries(catCounts).forEach(([cat, count]) => {
      filters.push({ id: cat, label: cat, count });
    });

    return filters;
  }, [allProjectMedia, photosCount, docsCount]);

  const filteredMedia = useMemo(() => {
    if (selectedCategory === "All") return allProjectMedia;
    if (selectedCategory === "Photos Only") return allProjectMedia.filter((m) => m.isImage);
    if (selectedCategory === "Documents Only") return allProjectMedia.filter((m) => !m.isImage);
    return allProjectMedia.filter((m) => m.category === selectedCategory);
  }, [allProjectMedia, selectedCategory]);

  // Group filtered media by Date
  const mediaByDate = useMemo(() => {
    const groups = {};
    filteredMedia.forEach((item) => {
      const dateKey = formatDisplayDate(item.uploadedAt) || "Recent Files";
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredMedia]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setToast({ open: true, message: "Please choose at least one photo or document", severity: "warning" });
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

    const targetId = project?._id || projectId;

    try {
      const response = await axiosInstance.post(`/lead/${targetId}/project-images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedImages = response?.data?.result || response?.data?.data || response?.data || [];
      setProject((prev) => ({
        ...prev,
        projectImages: Array.isArray(updatedImages) ? updatedImages : (prev?.projectImages || []),
      }));
      setSelectedFiles([]);
      setCaption("");
      setShowUploadModal(false);
      setToast({ open: true, message: "Files uploaded successfully!", severity: "success" });
      fetchProjectData();
    } catch (err) {
      console.error("Upload error", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to upload files";
      setToast({ open: true, message: errMsg, severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this photo from the project gallery?")) return;
    setDeletingId(imageId);
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
      setDeletingId(null);
    }
  };

  const projectTitle = project
    ? [
        project.customerName || project.name || [project.firstName, project.lastName].filter(Boolean).join(" "),
        project.systemSizeKw ? `${project.systemSizeKw} kW` : "",
        project.projectType || "Residential",
      ]
        .filter(Boolean)
        .join(" · ")
    : "Project Photos & Documents";

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
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
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
              Photos & Documents
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Tooltip title="Back to Project Overview">
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

            {/* Total count badge */}
            <Chip
              label={`${allProjectMedia.length} files`}
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(37, 99, 235, 0.18)" : "rgba(37, 99, 235, 0.08)",
                color: isDark ? "#60a5fa" : BRAND,
                fontWeight: 700,
                fontSize: 12,
                height: 24,
              }}
            />

            {photosCount > 0 && (
              <Chip
                label={`${photosCount} photos`}
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                  color: isDark ? "#94a3b8" : "#475569",
                  fontWeight: 600,
                  fontSize: 11.5,
                  height: 24,
                }}
              />
            )}

            {docsCount > 0 && (
              <Chip
                label={`${docsCount} documents`}
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)",
                  color: isDark ? "#fca5a5" : "#dc2626",
                  fontWeight: 600,
                  fontSize: 11.5,
                  height: 24,
                }}
              />
            )}
          </Stack>
        </Box>
      </Stack>

      {/* Filter Categories Pill Row */}
      {categoryFilters.length > 1 && (
        <Box sx={{ mb: 3.5, overflowX: "auto", pb: 0.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {categoryFilters.map((filter) => {
              const active = selectedCategory === filter.id;
              return (
                <Chip
                  key={filter.id}
                  clickable
                  onClick={() => setSelectedCategory(filter.id)}
                  label={
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <span>{filter.label}</span>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          px: 0.7,
                          py: 0.1,
                          borderRadius: "10px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          bgcolor: active ? "rgba(255,255,255,0.25)" : isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                          color: active ? "#ffffff" : isDark ? "#cbd5e1" : "#475569",
                        }}
                      >
                        {filter.count}
                      </Box>
                    </Box>
                  }
                  sx={{
                    height: 32,
                    fontSize: "0.825rem",
                    fontWeight: active ? 700 : 500,
                    bgcolor: active ? BRAND : isDark ? "#0e1526" : "#ffffff",
                    color: active ? "#ffffff" : isDark ? "#cbd5e1" : "#334155",
                    border: active ? "none" : isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: active ? BRAND_DARK : isDark ? "#1e293b" : "#f1f5f9",
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Media Grid or Empty State */}
      {Object.keys(mediaByDate).length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 10,
            px: 3,
            textAlign: "center",
            borderRadius: "16px",
            bgcolor: isDark ? "#0b101d" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${BORDER}`,
          }}
        >
          <FolderOpen sx={{ fontSize: 52, color: isDark ? "#334155" : "#cbd5e1", mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color={isDark ? "#f8fafc" : INK}>
            {selectedCategory === "All" ? "No photos or documents uploaded yet" : `No items under "${selectedCategory}"`}
          </Typography>
          <Typography variant="body2" sx={{ color: MUTED, mt: 0.75, maxWidth: 520, mx: "auto" }}>
            Files uploaded across project stages (Registration, KYC Documents, Site Survey, Installation, DCR Certificate, Meter Installation, etc.) will automatically appear here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={4.5}>
          {Object.entries(mediaByDate).map(([dateLabel, items]) => (
            <Box key={dateLabel}>
              {/* Date Header */}
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
                  label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
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

              {/* Grid of Items for this Date */}
              <Grid container spacing={2.5}>
                {items.map((item) => {
                  const assetUrl = toBackendAssetUrl(item.url);
                  const isImage = item.isImage;
                  const isPdf = item.isPdf;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id || item._id || item.url}>
                      <Box
                        sx={{
                          position: "relative",
                          borderRadius: "14px",
                          overflow: "hidden",
                          bgcolor: isDark ? "#0b101d" : "#ffffff",
                          border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #eef2f6",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)",
                          transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            boxShadow: "0 12px 24px -4px rgba(0,0,0,0.08)",
                            "& .image-actions-overlay": { opacity: 1 },
                            "& .photo-img": { transform: "scale(1.03)" },
                          },
                        }}
                      >
                        {isImage ? (
                          /* IMAGE RENDER */
                          <ProjectImageThumbnail
                            item={item}
                            assetUrl={assetUrl}
                            isDark={isDark}
                            onPreview={setPreviewImage}
                            onDelete={handleDeleteImage}
                            deletingId={deletingId}
                          />
                        ) : (
                          /* DOCUMENT / PDF RENDER */
                          <Box
                            sx={{
                              p: 2.25,
                              minHeight: 195,
                              bgcolor: isDark ? "#090d18" : "#f8fafc",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${BORDER}`,
                              position: "relative",
                            }}
                          >
                            <Box>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
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
                                      fontSize: 9.5,
                                      bgcolor: isDark ? "rgba(37,99,235,0.2)" : "rgba(37,99,235,0.1)",
                                      color: isDark ? "#60a5fa" : BRAND,
                                      maxWidth: 130,
                                    }}
                                  />
                                )}
                              </Stack>

                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ my: 1 }}>
                                <Box
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: isPdf
                                      ? isDark
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : "rgba(239, 68, 68, 0.1)"
                                      : isDark
                                      ? "rgba(37, 99, 235, 0.15)"
                                      : "rgba(37, 99, 235, 0.1)",
                                    color: isPdf ? "#ef4444" : BRAND,
                                    flexShrink: 0,
                                  }}
                                >
                                  {isPdf ? <PictureAsPdfOutlined sx={{ fontSize: 26 }} /> : <DescriptionOutlined sx={{ fontSize: 26 }} />}
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Tooltip title={item.name || "Document"}>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={800}
                                      color={isDark ? "#f8fafc" : INK}
                                      sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        lineHeight: 1.3,
                                      }}
                                    >
                                      {item.name || "Project Document"}
                                    </Typography>
                                  </Tooltip>
                                  <Typography variant="caption" sx={{ color: MUTED, display: "block", mt: 0.3 }}>
                                    {isPdf ? "PDF Document" : "File Attachment"} · {formatDisplayTime(item.uploadedAt) || "12:00 PM"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>

                            {/* Action Buttons for Document */}
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                fullWidth
                                component="a"
                                href={assetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                sx={{
                                  height: 32,
                                  bgcolor: BRAND,
                                  color: "#ffffff",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  borderRadius: "7px",
                                  "&:hover": { bgcolor: BRAND_DARK },
                                }}
                              >
                                View File
                              </Button>
                              <IconButton
                                size="small"
                                component="a"
                                href={assetUrl}
                                download={item.name || "solar-document"}
                                target="_blank"
                                sx={{
                                  height: 32,
                                  width: 32,
                                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                  color: isDark ? "#cbd5e1" : "#475569",
                                  borderRadius: "7px",
                                  "&:hover": { bgcolor: isDark ? "#1e293b" : "#e2e8f0" },
                                }}
                              >
                                <Download sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Stack>
                          </Box>
                        )}

                        {/* Card Info Footer */}
                        <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                            color={isDark ? "#f8fafc" : INK}
                            sx={{ fontSize: "0.85rem" }}
                          >
                            {item.caption || item.name || "Project File"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: MUTED, display: "block", mt: 0.25 }}>
                            {item.stage || item.category || "Project Completion"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Stack>
      )}

      {/* Upload Photos Modal */}
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
              {UPLOAD_CATEGORIES.map((cat) => (
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

            {/* File Dropzone */}
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

      {/* Lightbox Preview Modal */}
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
                bgcolor: "rgba(0,0,0,0.85)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="#ffffff">
                  {previewImage.caption || previewImage.name || "File Preview"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  {formatDisplayDate(previewImage.uploadedAt) || "Recent"} at {formatDisplayTime(previewImage.uploadedAt) || "12:00 PM"} · {previewImage.category} {previewImage.stage ? `(${previewImage.stage})` : ""}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  component="a"
                  href={toBackendAssetUrl(previewImage.url)}
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

            {/* Media Content */}
            <DialogContent sx={{ p: 0, bgcolor: "#000000", textAlign: "center" }}>
              <Box
                component="img"
                src={toBackendAssetUrl(previewImage.url)}
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
