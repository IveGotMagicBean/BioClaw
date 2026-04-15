#!/usr/bin/env python3
"""
SEC Report Generator — Typst Edition (v2)
Compact, text-rich report matching Biomni / Phylo quality.

Key design principles (learned from Biomni):
  - Per-construct analysis = SHORT text paragraphs, not full pages
  - NO page breaks between individual constructs
  - Figures embedded inline, not one-per-page
  - Discussion section with substantive multi-paragraph analysis
  - Compact layout: maximize text density, minimize whitespace
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

_skill_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_skill_root / "report-template"))

from report_builder import ReportBuilder, T


# ── Helpers ──────────────────────────────────────────────────────────────────

ZONE_MAP = {
    "aggregate": "Void / Aggregate",
    "large_oligomer": "Very Large (HMW)",
    "oligomer": "Large Oligomer",
    "dimer": "Mid-size",
    "monomer": "Small / Monomer",
    "small_molecule": "Small Molecule",
    "none": "No signal",
}

def _short(name: str, maxlen: int = 26) -> str:
    """Shorten construct name for table/heading display."""
    s = name.replace(' 001', '').replace('_001', '').strip()
    s = s.replace('_', '-')
    if len(s) <= maxlen:
        return s
    return s[:maxlen - 1] + '…'


def _q_label(s: float) -> str:
    if s >= 7: return "Excellent"
    if s >= 5: return "Good"
    if s >= 3: return "Moderate"
    return "Poor"

def _star(s: float) -> str:
    if s >= 7: return "\\*"
    return ""

def _interpret(r) -> str:
    """Generate a substantive interpretation paragraph for a construct."""
    parts = []

    # Dominant peak description
    dom = None
    for p in sorted(r.peaks, key=lambda p: p.relative_area_pct, reverse=True):
        if p.relative_area_pct >= 10:
            dom = p
            break

    if dom:
        zone = ZONE_MAP.get(dom.classification, dom.classification)
        parts.append(
            f"Dominant peak at {dom.elution_volume:.1f} mL "
            f"({zone} zone), {dom.relative_area_pct:.0f}% of total area"
            f"{', FWHM = ' + f'{dom.fwhm:.2f} mL' if dom.fwhm else ''}."
        )
    elif not r.peaks:
        return "No significant peaks detected above noise threshold."

    # Secondary peaks
    secondary = [p for p in r.peaks
                 if p != dom and p.relative_area_pct >= 5]
    if secondary:
        descs = [f"{p.elution_volume:.1f} mL ({p.relative_area_pct:.0f}%)"
                 for p in secondary[:3]]
        parts.append(f"Secondary peak(s) at {', '.join(descs)}.")

    # Aggregation
    if r.has_aggregation and r.aggregation_pct > 0:
        if r.aggregation_pct > 30:
            parts.append(
                f"Significant void-volume signal ({r.aggregation_pct:.0f}%) "
                f"indicates non-specific aggregation."
            )
        elif r.aggregation_pct > 5:
            parts.append(
                f"Minor void fraction ({r.aggregation_pct:.0f}%)."
            )

    # Homogeneity
    if r.homogeneity == "monodisperse" and r.quality_score >= 7:
        parts.append("Highly monodisperse profile.")
    elif r.homogeneity == "polydisperse":
        parts.append("Polydisperse — multiple species present.")
    elif r.homogeneity == "heterogeneous":
        parts.append("Heterogeneous elution profile.")

    # Broad peaks
    broad = [p for p in r.peaks if p.fwhm > 2.5]
    if broad:
        parts.append("Broad peak(s) suggest conformational heterogeneity "
                      "or equilibrium between oligomeric states.")

    # Ring/oligomer inference
    if r.dominant_species in ("large_oligomer", "oligomer") and r.quality_score >= 5:
        parts.append("Elution in the HMW zone is consistent with "
                      "higher-order oligomeric assembly.")

    return " ".join(parts) if parts else "Standard elution profile."


def _recommend(r) -> str:
    d = r.dominant_species
    q = r.quality_score
    if q >= 7 and d in ("large_oligomer", "oligomer"):
        return "Priority: cryo-EM / native MS"
    if q >= 7 and d == "dimer":
        return "Use as positive control"
    if q >= 7 and d == "monomer":
        return "Monomer control; SEC-MALS for MW"
    if r.has_aggregation and r.aggregation_pct > 30:
        return "Redesign interface"
    if r.homogeneity == "polydisperse":
        return "Buffer optimisation"
    if q >= 5:
        return "Consider optimisation"
    return "Low priority"


# ── Report Builder ───────────────────────────────────────────────────────────

def build_typst_report(
    results: list,
    image_files: list,
    figs_dir: str,
    output_path: str,
    void_volume: float = 8.0,
) -> str:
    sr = sorted(results, key=lambda r: r.quality_score, reverse=True)
    n = len(results)
    date_str = datetime.now().strftime("%B %Y")

    report = ReportBuilder(
        title="SEC Analysis Report",
        subtitle="De Novo Designed Heterodimeric Protein Ring Assemblies",
        author="BioClaw",
        date=date_str,
        project=f"Chain A (~53 kDa) + Chain B (~27 kDa) co-purified constructs",
        header_left="SEC Analysis Report -- De Novo Designed Protein Oligomers",
    )
    report.set_image_dir(Path(figs_dir).parent)

    # ── Title page metadata ──
    report.vspace("8pt")
    report.metadata_block([
        ("Constructs analysed", str(n)),
        ("Detection", "UV 280 nm"),
        ("Column", f"Superdex 200 Increase 10/300 GL (V0 ~ {void_volume:.1f} mL)"),
        ("Report generated", datetime.now().strftime("%Y-%m-%d")),
        ("Analysis", "Automated (Python / SciPy / Typst)"),
    ])

    # ═══════════════════════════════════════════════════════════════════════
    # 1. BACKGROUND
    # ═══════════════════════════════════════════════════════════════════════
    report.heading(1, "1. Background")
    report.text(
        f"This report presents a size-exclusion chromatography (SEC) analysis "
        f"of {n} de novo designed protein constructs intended to form specific "
        f"oligomeric assemblies, including dimers and ring-like higher-order "
        f"structures. Each sample consists of co-purified Chain A (~481 amino "
        f"acids, ~53 kDa) and Chain B (~243 amino acids, ~27 kDa), forming a "
        f"heterodimer of approximately 80 kDa."
    )
    report.text(
        "SEC provides a rapid, solution-phase readout of the oligomeric state "
        "distribution. Constructs that assemble into rings are expected to "
        "elute early (large apparent size), while failed or partially assembled "
        "constructs will elute as dimers, monomers, or aggregates. This "
        f"analysis covers {n} constructs with elution zones classified "
        f"relative to a void volume of ~{void_volume:.1f} mL."
    )
    report.callout(
        "No absolute MW calibration was applied. All size assignments are "
        "relative, based on elution position relative to the column void "
        "volume. The terms 'HMW', 'mid-size', and 'small/monomer' refer to "
        "relative elution zones only.",
        title="Note", kind="note",
    )

    # ═══════════════════════════════════════════════════════════════════════
    # 2. METHODS
    # ═══════════════════════════════════════════════════════════════════════
    report.heading(1, "2. Methods")

    report.heading(2, "2.1 Instrumentation and Columns")
    report.text(
        f"Purified protein samples were injected onto an SEC column (inferred "
        f"to be a Superdex 200 Increase 10/300 GL or equivalent, ~24 mL bed "
        f"volume), AKTA system, UV detection at 280 nm. Elution volumes "
        f"reported relative to sample application anchor (0 mL = injection "
        f"point). Void volume estimated at ~{void_volume:.1f} mL."
    )

    report.heading(2, "2.2 Data Processing")
    report.raw(T.list([
        "Savitzky-Golay smoothing (window = 15 points / 0.75 mL, polynomial order 3) to reduce instrument noise.",
        "Automated peak detection using SciPy `find\\_peaks` with adaptive height threshold (3% of maximum signal or 1.0 mAU, whichever is greater), minimum prominence of 1.5 mAU, and minimum inter-peak distance of 0.5 mL.",
        "Peak area integration by trapezoidal rule between 10%-height boundaries.",
        "Species classification based on elution volume relative to void volume.",
    ]))

    report.heading(2, "2.3 Elution Zone Definitions")
    report.table(
        ["Zone", "Volume Range (mL)", "Interpretation"],
        [
            ["Void / Aggregate", f"0.0 -- {void_volume:.1f}", "Aggregates or void-excluded species"],
            ["Very Large (HMW)", f"{void_volume:.1f} -- {void_volume+2.5:.1f}", "Ring candidates (large oligomers)"],
            ["Large Oligomer", f"{void_volume+2.5:.1f} -- {void_volume+4.5:.1f}", "Intermediate oligomers"],
            ["Mid-size", f"{void_volume+4.5:.1f} -- {void_volume+6.5:.1f}", "Dimer / tetramer range"],
            ["Small / Monomer", f"{void_volume+6.5:.1f} -- {void_volume+12:.1f}", "Monomer-like species"],
        ],
        caption="Elution zone definitions.",
    )

    # ═══════════════════════════════════════════════════════════════════════
    # 3. RESULTS
    # ═══════════════════════════════════════════════════════════════════════
    report.heading(1, "3. Results")

    # 3.1 Overview metrics
    top_cands = [r for r in sr if r.quality_score >= 7
                 and r.dominant_species in ("large_oligomer", "oligomer")]
    avg_q = sum(r.quality_score for r in results) / n if n else 0

    report.heading(2, "3.1 Overview")
    report.metric_cards([
        {"label": "Constructs", "value": str(n)},
        {"label": "Ring Candidates", "value": str(len(top_cands))},
        {"label": "Best Quality", "value": f"{sr[0].quality_score:.1f}" if sr else "N/A"},
        {"label": "Avg Quality", "value": f"{avg_q:.1f}"},
    ])
    report.vspace("8pt")

    # 3.2 Summary table — compact
    report.heading(2, "3.2 Construct Summary Table")
    summary_rows = []
    for r in sr:
        zone = ZONE_MAP.get(r.dominant_species, r.dominant_species)
        dom = max(r.peaks, key=lambda p: p.relative_area_pct, default=None)
        peak_ml = f"{dom.elution_volume:.1f}" if dom else "N/A"
        dom_frac = f"{dom.relative_area_pct:.0f}%" if dom else "N/A"
        agg = f"{r.aggregation_pct:.0f}%" if r.has_aggregation else "0%"
        summary_rows.append([
            _short(r.name), peak_ml, zone, dom_frac, agg, _q_label(r.quality_score),
        ])
    report.table(
        ["Construct", "Dom. Peak (mL)", "Dom. Zone", "Dom. Frac.", "Void Frac.", "Classification"],
        summary_rows,
        caption="Summary of all constructs ranked by quality score.",
    )

    # 3.3 Figures — overlay, zone fractions, ranking
    overlay = os.path.join(figs_dir, "comparison_overlay.png")
    zone_frac = os.path.join(figs_dir, "zone_fractions.png")
    ranking = os.path.join(figs_dir, "ranking_summary.png")

    if os.path.exists(overlay):
        report.heading(2, "3.3 SEC Overlay Comparison")
        report.image("figures/comparison_overlay.png",
                     caption=f"All {n} constructs overlaid vs. elution zones "
                             f"(normalized, aligned to injection point).",
                     width="100%")

    if os.path.exists(zone_frac):
        report.heading(2, "3.4 Zone Fraction Analysis")
        report.image("figures/zone_fractions.png",
                     caption="Fraction of total peak area in each elution "
                             "zone per construct, sorted by dominant peak position.",
                     width="100%")

    if os.path.exists(ranking):
        report.heading(2, "3.5 Quality Ranking")
        report.image("figures/ranking_summary.png",
                     caption="Constructs ranked by SEC profile quality score (0--10).",
                     width="95%")

    # 3.6 Individual chromatograms grid
    grid_path = os.path.join(figs_dir, "individual_grid.png")
    if os.path.exists(grid_path):
        report.heading(2, "3.6 Individual Chromatograms")
        report.image("figures/individual_grid.png",
                     caption=f"Individual SEC chromatograms for all {n} constructs. "
                             "Elution zones are shaded; dashed line marks dominant peak.",
                     width="100%")

    # 3.7 Per-construct highlights — COMPACT, text-focused (Biomni style)
    report.heading(2, "3.7 Per-Construct Highlights")

    for r in sr:
        quality = _q_label(r.quality_score)
        star = " \\*" if r.quality_score >= 7 else ""
        report.heading(3, f"{_short(r.name, 32)} -- {quality}{star}")
        report.text(_interpret(r))
        report.text(f"*Recommendation:* {_recommend(r)}")

    # ═══════════════════════════════════════════════════════════════════════
    # 4. DISCUSSION
    # ═══════════════════════════════════════════════════════════════════════
    report.heading(1, "4. Discussion")

    # 4.1 Ring candidates
    rings = [r for r in sr if r.dominant_species in ("large_oligomer", "oligomer")
             and r.quality_score >= 5]
    if rings:
        report.heading(2, "4.1 Ring Assembly Candidates")
        best = rings[0]
        names = ", ".join(r.name for r in rings)
        report.text(
            f"The clearest ring assembly candidates are {names}. "
            f"These show dominant peaks in the HMW zone "
            f"({void_volume:.1f}--{void_volume+4.5:.1f} mL), "
            f"consistent with higher-order oligomeric assemblies substantially "
            f"larger than the expected ~80 kDa heterodimer. "
        )
        # Check for broad vs sharp
        broad_rings = [r for r in rings if any(p.fwhm > 2.0 for p in r.peaks)]
        if broad_rings:
            report.text(
                f"Several candidates ({', '.join(r.name for r in broad_rings)}) "
                f"show broad FWHM in the HMW peak, which may reflect a mixture "
                f"of oligomeric states (e.g., rings of different stoichiometries) "
                f"rather than a single discrete ring. This is common for de novo "
                f"designed rings where the assembly equilibrium may favour a "
                f"distribution of ring sizes."
            )

    # 4.2 Monodisperse constructs
    mono = [r for r in sr if r.homogeneity in ("monodisperse", "predominantly_monodisperse")
            and r.quality_score >= 7]
    if mono:
        report.heading(2, "4.2 Monodisperse Assemblies")
        report.text(
            f"The most monodisperse samples in the dataset are "
            f"{', '.join(r.name for r in mono[:3])}. "
            f"These constructs show sharp, symmetric peaks with minimal "
            f"secondary species, making them excellent candidates for "
            f"structural characterisation (SEC-MALS, cryo-EM, or "
            f"crystallography)."
        )

    # 4.3 Heterogeneous HMW
    hetero = [r for r in sr if r.dominant_species in ("large_oligomer", "oligomer")
              and r.homogeneity == "polydisperse"]
    if hetero:
        report.heading(2, "4.3 Heterogeneous HMW Assemblies")
        report.text(
            f"Several constructs ({', '.join(r.name for r in hetero[:4])}) "
            f"show HMW-dominant profiles but with broad, multi-modal "
            f"distributions. These may represent: (1) a mixture of ring sizes "
            f"in equilibrium, (2) partially assembled intermediates, or "
            f"(3) non-specific oligomerisation. Distinguishing between these "
            f"possibilities requires orthogonal techniques (native PAGE, DLS, "
            f"or cryo-EM). The low void fractions argue against simple "
            f"aggregation."
        )

    # 4.4 Aggregation issues
    agg_bad = [r for r in sr if r.has_aggregation and r.aggregation_pct > 15]
    if agg_bad:
        report.heading(2, "4.4 Aggregation Concerns")
        for r in agg_bad:
            report.text(
                f"*{r.name}*: {r.aggregation_pct:.0f}% void-volume signal. "
                f"Buffer optimisation or interface redesign recommended."
            )

    # 4.5 Methodological notes
    report.heading(2, "4.5 Methodological Considerations")
    report.raw(T.list([
        "No absolute MW calibration: all size assignments are relative to void volume position.",
        "Peak metrics (FWHM, area fraction) depend on smoothing parameters and baseline correction.",
        "SEC-MALS would be required for definitive molecular weight determination.",
        "Normalisation: all traces are normalised to their own maximum UV signal; absolute signal levels (protein concentrations) are not compared between constructs.",
    ]))

    # ═══════════════════════════════════════════════════════════════════════
    # 5. CONCLUSIONS
    # ═══════════════════════════════════════════════════════════════════════
    report.heading(1, "5. Conclusions and Recommendations")

    report.heading(2, "5.1 Ranked Construct Summary")
    rank_rows = []
    for i, r in enumerate(sr):
        rank_rows.append([
            str(i + 1), _short(r.name),
            ZONE_MAP.get(r.dominant_species, r.dominant_species),
            _recommend(r),
        ])
    report.table(
        ["Rank", "Construct", "Classification", "Recommendation"],
        rank_rows,
        caption="Final construct ranking with recommendations.",
    )

    report.heading(2, "5.2 Recommended Next Experiments")

    if top_cands:
        names = ", ".join(r.name for r in top_cands)
        report.callout(
            f"*For ring candidates ({names}):*\n"
            "- Native PAGE -- rapid check for discrete oligomeric bands vs. smear\n"
            "- DLS (Dynamic Light Scattering) -- measure hydrodynamic radius and polydispersity index (PDI < 0.2 supports a discrete ring)\n"
            "- Cryo-EM -- definitive structural characterisation; collect and concentrate the HMW SEC fraction\n"
            "- Native mass spectrometry -- determine exact stoichiometry of the ring",
            title="Priority Actions", kind="success",
        )

    mono_good = [r for r in sr if r.dominant_species in ("dimer", "monomer")
                 and r.quality_score >= 7]
    if mono_good:
        names = ", ".join(r.name for r in mono_good[:3])
        report.callout(
            f"*For monodisperse constructs ({names}):*\n"
            "- SEC-MALS -- determine absolute MW of the dominant peak\n"
            "- Cryo-EM or X-ray crystallography -- high-resolution structure\n"
            "- Analytical ultracentrifugation (AUC) -- confirm oligomeric state in solution",
            title="Secondary Actions", kind="note",
        )

    if hetero:
        names = ", ".join(r.name for r in hetero[:3])
        report.callout(
            f"*For heterogeneous HMW constructs ({names}):*\n"
            "- Buffer screen -- vary salt concentration, pH, and additives (glycerol, detergent)\n"
            "- Temperature screen -- some ring assemblies are temperature-sensitive\n"
            "- SEC-MALS on the HMW fraction -- determine whether the HMW material is a discrete species",
            title="Optimisation", kind="warning",
        )

    report.vspace("16pt")
    report.callout(
        "Report generated by BioClaw. All data sourced from user-uploaded "
        "AKTA CSV files. No absolute molecular weight calibration was applied.",
        title="Disclaimer", kind="note",
    )

    # ── Compile ──
    pdf_path = report.compile(output_path)
    return str(pdf_path)
