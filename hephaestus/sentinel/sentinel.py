from typing import Literal
from dataclasses import dataclass
from sentinel.fgs import compute_fgs, FGSInput, FGSResult, ColumnMetadata
from sentinel.blast_radius import compute_blast_radius, LineageGraph
from sentinel.diff_engine import compute_change_magnitude, SchemaChange, VolumeChange, DiffResult
from sentinel.skills.skills_loader import SkillsLoader
from sentinel.skills.base_skill import SkillContext, SkillResult
from config.settings import settings

@dataclass
class SentinelInput:
    pr_number: int
    changed_tables: list[str]
    column_metadata: dict[str, list[ColumnMetadata]]
    lineage_graph: LineageGraph
    schema_changes: dict[str, SchemaChange]
    volume_changes: dict[str, VolumeChange]

@dataclass
class SentinelDecision:
    pr_number: int
    verdict: Literal["PASS", "BLOCK"]
    overall_fgs: float
    per_table_fgs: dict[str, FGSResult]
    per_table_diff: dict[str, DiffResult]
    blast_radius: int
    skill_results: list[SkillResult]
    block_reasons: list[str]
    markdown_comment: str

class Sentinel:
    def __init__(self):
        self._loader = SkillsLoader()
        self._skills = self._loader.discover()
        
    def evaluate(self, sentinel_input: SentinelInput) -> SentinelDecision:
        block_reasons = []
        
        blast_radius = compute_blast_radius(
            changed_nodes=sentinel_input.changed_tables,
            lineage_graph=sentinel_input.lineage_graph,
            decay_constant=settings.LAMBDA_DECAY
        )
        
        per_table_fgs = {}
        per_table_diff = {}
        skill_results = []
        overall_fgs_sum = 0.0
        
        for table_fqn in sentinel_input.changed_tables:
            cols = sentinel_input.column_metadata.get(table_fqn, [])
            fgs_in = FGSInput(columns=cols, blast_radius=blast_radius)
            fgs_out = compute_fgs(fgs_in)
            per_table_fgs[table_fqn] = fgs_out
            overall_fgs_sum += fgs_out.score
            
            if fgs_out.is_blocked:
                block_reasons.append(f"Table {table_fqn} FGS score {fgs_out.score:.2f} is below threshold {settings.FGS_BLOCK_THRESHOLD:.2f}.")
            
            schema_change = sentinel_input.schema_changes.get(table_fqn, SchemaChange(0, 0, 0, 0))
            volume_change = sentinel_input.volume_changes.get(table_fqn, VolumeChange(0, 0))
            diff_out = compute_change_magnitude(
                schema_change=schema_change,
                volume_change=volume_change,
                alpha=settings.ALPHA_STRUCTURAL,
                beta=settings.BETA_VOLUME
            )
            per_table_diff[table_fqn] = diff_out
            
            col_dicts = [
                {"name": c.name, "description": c.description, "governance_tags": c.governance_tags, "tier": c.tier}
                for c in cols
            ]
            
            skill_ctx = SkillContext(
                table_fqn=table_fqn,
                columns=col_dicts,
                pr_number=sentinel_input.pr_number,
                changed_files=sentinel_input.changed_tables,
                extra={}
            )
            
            for skill_class in self._skills.values():
                skill_instance = skill_class()
                res = skill_instance.run(skill_ctx)
                skill_results.append(res)
                
                if "critical_count" in res.metadata and res.metadata["critical_count"] > 0:
                    block_reasons.append(f"Skill '{res.skill_name}' failed on {table_fqn} with critical violations.")
                elif not res.passed:
                    block_reasons.append(f"Skill '{res.skill_name}' failed on {table_fqn}.")

        overall_fgs = overall_fgs_sum / len(sentinel_input.changed_tables) if sentinel_input.changed_tables else 0.0
        
        verdict: Literal["PASS", "BLOCK"] = "BLOCK" if block_reasons else "PASS"
        
        decision = SentinelDecision(
            pr_number=sentinel_input.pr_number,
            verdict=verdict,
            overall_fgs=overall_fgs,
            per_table_fgs=per_table_fgs,
            per_table_diff=per_table_diff,
            blast_radius=blast_radius,
            skill_results=skill_results,
            block_reasons=block_reasons,
            markdown_comment=""
        )
        
        decision.markdown_comment = self._build_markdown_comment(decision)
        return decision
        
    def _build_markdown_comment(self, decision: SentinelDecision) -> str:
        lines = []
        if decision.verdict == "PASS":
            lines.append("## ✅ Hephaestus Sentinel: PASS")
        else:
            lines.append("## 🚫 Hephaestus Sentinel: BLOCK")
            
        lines.append("")
        lines.append(f"**Overall FGS:** {decision.overall_fgs:.2f}")
        lines.append(f"**Blast Radius:** {decision.blast_radius} nodes")
        lines.append("")
        
        if decision.block_reasons:
            lines.append("### Block Reasons")
            for br in decision.block_reasons:
                lines.append(f"- {br}")
            lines.append("")
            
        lines.append("### Table Breakdown")
        lines.append("| Table | FGS Score | Compliance | Blast Penalty | \u0394 Magnitude |")
        lines.append("|-------|-----------|------------|---------------|------------|")
        for t, fgs in decision.per_table_fgs.items():
            diff = decision.per_table_diff[t]
            lines.append(f"| `{t}` | {fgs.score:.2f} | {fgs.weighted_compliance:.2f} | -{fgs.blast_penalty:.2f} | {diff.delta:.2f} |")
            
        lines.append("")
        lines.append("### Skills Summary")
        for sr in decision.skill_results:
            status = "✅" if sr.passed else "❌"
            lines.append(f"- {status} **{sr.skill_name}**: {sr.score:.2f} score")
            for v in sr.violations:
                lines.append(f"  - {v}")
                
        return "\n".join(lines)
