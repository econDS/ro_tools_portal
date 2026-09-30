"""Validate the design kit only. No browser or live endpoint testing is performed."""
import copy
import json
import unittest
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit, unquote
from jsonschema import Draft202012Validator, FormatChecker, ValidationError

ROOT = Path(__file__).resolve().parents[1]
def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))
REG = load('data/tools.registry.v1.json')
SCHEMA = load('schemas/tools-registry.schema.json')
SOURCE_IDS = {s['id'] for s in load('data/sources.json')['sources']}
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())

def approved_launch_url(url):
    if not isinstance(url, str):
        return False
    try:
        p = urlsplit(url)
        return (p.scheme == 'https' and p.hostname == 'econds.github.io'
                and p.port is None and p.username is None and p.password is None
                and not p.query and not p.fragment and p.path.startswith('/')
                and p.path.endswith('/') and '..' not in unquote(p.path).split('/')
                and chr(92) not in unquote(p.path))
    except ValueError:
        return False

class DesignKitTests(unittest.TestCase):
    def test_schema_is_valid(self):
        Draft202012Validator.check_schema(SCHEMA)
    def test_seed_validates(self):
        VALIDATOR.validate(REG)
    def test_unique_tool_ids(self):
        ids=[t['id'] for t in REG['tools']]
        self.assertEqual(len(ids), len(set(ids)))
    def test_exact_four_existing_repos(self):
        self.assertEqual({t['repository'] for t in REG['tools'] if t['listingStatus']=='listed'}, {
          'econDS/ro-leveling-map','econDS/ro-reform-preparation',
          'econDS/dim_glacier_planner','econDS/sessrumnir-ocean-week-guide'})
    def test_existing_urls_are_approved(self):
        for t in REG['tools']:
            if t['listingStatus']=='listed': self.assertTrue(approved_launch_url(t['canonicalUrl']))
    def test_planned_has_no_launch_or_repo_url(self):
        for t in REG['tools']:
            if t['listingStatus']=='planned':
                self.assertIsNone(t['canonicalUrl']); self.assertIsNone(t['repositoryUrl'])
    def test_planned_launch_is_rejected_by_schema(self):
        bad=copy.deepcopy(REG)
        bad['tools'][-1]['canonicalUrl']='https://econds.github.io/ro-grade-refine-planner/'
        with self.assertRaises(ValidationError): VALIDATOR.validate(bad)
    def test_related_ids_exist_and_not_self(self):
        ids={t['id'] for t in REG['tools']}
        for t in REG['tools']:
            self.assertTrue(set(t['relatedToolIds']) <= ids)
            self.assertNotIn(t['id'], t['relatedToolIds'])
    def test_categories_exist(self):
        cats={c['id'] for c in REG['categories']}
        for t in REG['tools']: self.assertTrue(set(t['categories']) <= cats)
    def test_sources_exist(self):
        for t in REG['tools']: self.assertTrue(set(t['sourceIds']) <= SOURCE_IDS)
    def test_live_health_not_fabricated(self):
        for t in REG['tools']:
            self.assertIn(t['linkHealth']['state'], ['unverified','not-applicable'])
            self.assertIsNone(t['linkHealth']['lastCheckedAt'])
    def test_no_suite_support_fabricated(self):
        for t in REG['tools']: self.assertEqual(t['suiteCapabilitiesConfirmed'], [])
    def test_ocean_path_branch_and_period(self):
        t=next(t for t in REG['tools'] if t['id']=='ocean-week-guide')
        self.assertEqual(t['defaultBranchObserved'],'master')
        self.assertEqual(t['publishingSourceObserved'],'docs')
        self.assertNotIn('/docs/',t['canonicalUrl'])
        self.assertEqual(t['contentLifecycle'],'archived-period')
        self.assertLess(date.fromisoformat(t['event']['endsOn']), date.fromisoformat(REG['reviewedOn']))
        self.assertIsNone(t['event']['exactEndAt'])
    def test_dim_slug_preserved(self):
        t=next(t for t in REG['tools'] if t['id']=='dim-glacier')
        self.assertTrue(t['canonicalUrl'].endswith('/dim_glacier_planner/'))
    def test_journeys_reference_existing_ids(self):
        ids={t['id'] for t in REG['tools']}
        for j in load('data/journeys.v1.json')['journeys']:
            self.assertTrue(set(j['toolIds']) <= ids)
    def test_urls_reject_dangerous_candidates(self):
        for url in ['javascript:alert(1)','https://evil.example/tool/',
                    'https://econds.github.io.evil.example/tool/',
                    'https://econds.github.io@evil.example/tool/',
                    'https://econds.github.io/a/%2e%2e/b/',
                    'https://econds.github.io/a/?payload=private',
                    'https://econds.github.io:444/a/',
                    'http://econds.github.io/a/',
                    'https://econds.github.io/a/%5c/b/']:
            self.assertFalse(approved_launch_url(url), url)
    def test_manifest_template_makes_no_capability_claim(self):
        m=load('examples/tool-manifest.template.json')
        self.assertEqual(m['manifestState'],'template-not-deployed')
        self.assertEqual(m['implementedSuiteCapabilities'],[])
        self.assertIsNone(m['appVersion'])
    # Planning docs and design-phase prompts are kept locally only (not in the public repository).
    @unittest.skipUnless((ROOT/'PLAN.md').is_file(), 'planning docs are local-only')
    def test_required_handoff_docs_exist(self):
        for fn in ['PLAN.md','AGENTS.md','CODEX_START_PROMPT.md',
                   'docs/ARCHITECTURE.md','docs/NAV_CONTRACT.md','docs/HANDOFF_CONTRACT.md',
                   'docs/REPOSITORY_ROLLOUT.md','docs/ACCEPTANCE_TESTS.md','docs/SOURCES.md']:
            self.assertTrue((ROOT/fn).is_file(), fn)
    @unittest.skipUnless((ROOT/'PLAN.md').is_file(), 'planning docs are local-only')
    def test_all_five_integration_prompts_exist(self):
        self.assertEqual(len(list((ROOT/'prompts').glob('*.md'))),5)
    def test_no_silent_game_data_verification(self):
        for t in REG['tools']: self.assertIsNone(t['gameDataVerifiedOn'])

if __name__=='__main__':
    unittest.main()
