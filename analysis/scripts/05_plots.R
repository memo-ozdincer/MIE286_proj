# ── 05_plots.R ───────────────────────────────────────────────────
# Generate all figures for the report. PDF to ../report/figures/.
# Input:  output/clean_trials.rds, output/participant_means.rds

library(tidyverse)

pm <- readRDS("output/participant_means.rds")
ct <- readRDS("output/clean_trials.rds")

fig_dir <- "../report/figures"
dir.create(fig_dir, showWarnings = FALSE, recursive = TRUE)

pal <- c("Visual" = "#2166AC", "Auditory" = "#D6604D")

# ── Figure 1: RT Boxplot ────────────────────────────────────────
pm_long_rt <- pm %>%
  select(uid, mean_rt_visual, mean_rt_auditory) %>%
  pivot_longer(cols = c(mean_rt_visual, mean_rt_auditory),
               names_to = "condition", values_to = "rt") %>%
  mutate(condition = ifelse(grepl("visual", condition), "Visual", "Auditory"))

p1 <- ggplot(pm_long_rt, aes(x = condition, y = rt, fill = condition)) +
  geom_boxplot(width = 0.5, outlier.shape = NA, alpha = 0.7) +
  geom_jitter(width = 0.12, size = 1.5, alpha = 0.6) +
  scale_fill_manual(values = pal) +
  labs(x = "Feedback Condition", y = "Mean Reaction Time (ms)") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none",
        panel.grid.major.x = element_blank())

ggsave(file.path(fig_dir, "rt_boxplot.pdf"), p1, width = 6, height = 4)
cat("Saved: rt_boxplot.pdf\n")

# ── Figure 2: Error Boxplot ─────────────────────────────────────
pm_long_err <- pm %>%
  select(uid, mean_error_visual, mean_error_auditory) %>%
  pivot_longer(cols = c(mean_error_visual, mean_error_auditory),
               names_to = "condition", values_to = "error") %>%
  mutate(condition = ifelse(grepl("visual", condition), "Visual", "Auditory"))

p2 <- ggplot(pm_long_err, aes(x = condition, y = error, fill = condition)) +
  geom_boxplot(width = 0.5, outlier.shape = NA, alpha = 0.7) +
  geom_jitter(width = 0.12, size = 1.5, alpha = 0.6) +
  scale_fill_manual(values = pal) +
  labs(x = "Feedback Condition", y = "Mean Radial Error (px)") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none",
        panel.grid.major.x = element_blank())

ggsave(file.path(fig_dir, "error_boxplot.pdf"), p2, width = 6, height = 4)
cat("Saved: error_boxplot.pdf\n")

# ── Figure 3: SAT Scatter ───────────────────────────────────────
ct_plot <- ct %>%
  mutate(Condition = ifelse(condition == "visual", "Visual", "Auditory"))

# Compute correlations for annotation
r_vis <- cor(ct_plot$rt[ct_plot$Condition == "Visual"],
             ct_plot$error[ct_plot$Condition == "Visual"])
r_aud <- cor(ct_plot$rt[ct_plot$Condition == "Auditory"],
             ct_plot$error[ct_plot$Condition == "Auditory"])

p3 <- ggplot(ct_plot, aes(x = rt, y = error, color = Condition)) +
  geom_point(alpha = 0.15, size = 0.8) +
  geom_smooth(method = "lm", se = FALSE, linewidth = 1.2) +
  scale_color_manual(values = pal) +
  labs(x = "Reaction Time (ms)", y = "Radial Error (px)",
       color = "Condition") +
  annotate("text", x = Inf, y = Inf,
           label = sprintf("r[vis] == %.3f", r_vis),
           parse = TRUE, hjust = 1.1, vjust = 1.5, size = 3.5, color = pal["Visual"]) +
  annotate("text", x = Inf, y = Inf,
           label = sprintf("r[aud] == %.3f", r_aud),
           parse = TRUE, hjust = 1.1, vjust = 3.0, size = 3.5, color = pal["Auditory"]) +
  theme_minimal(base_size = 12) +
  theme(legend.position = c(0.15, 0.85))

ggsave(file.path(fig_dir, "sat_scatter.pdf"), p3, width = 7, height = 5)
cat("Saved: sat_scatter.pdf\n")

# ── Figure 4: Covariate Bar Chart ───────────────────────────────
cov_data <- pm %>%
  mutate(overall_rt = (mean_rt_visual + mean_rt_auditory) / 2) %>%
  group_by(device) %>%
  summarise(
    mean_rt = mean(overall_rt),
    se_rt   = sd(overall_rt) / sqrt(n()),
    n       = n(),
    .groups = "drop"
  )

p4 <- ggplot(cov_data, aes(x = reorder(device, mean_rt), y = mean_rt)) +
  geom_col(fill = "#4393C3", width = 0.6, alpha = 0.8) +
  geom_errorbar(aes(ymin = mean_rt - se_rt, ymax = mean_rt + se_rt),
                width = 0.2) +
  geom_text(aes(label = sprintf("n=%d", n)), vjust = -0.5, size = 3.5) +
  labs(x = "Device Type", y = "Mean Reaction Time (ms)") +
  coord_cartesian(ylim = c(0, max(cov_data$mean_rt + cov_data$se_rt) * 1.15)) +
  theme_minimal(base_size = 12) +
  theme(panel.grid.major.x = element_blank())

ggsave(file.path(fig_dir, "covariate_bar.pdf"), p4, width = 6, height = 4)
cat("Saved: covariate_bar.pdf\n")

cat("\n=== DONE: 05_plots.R ===\n")
