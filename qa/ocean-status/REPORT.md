# Ocean status accuracy

Base: 3dbc394950cde075c49a9de8444143aa7fe8df64, main, root publishing, clean checkout. Feature: chore/ocean-week-status-accuracy.

Baseline: Ocean already listed / guide / archived-period; event 2026-05-06 through 2026-06-04 Asia/Bangkok, before-maintenance, no exact end time, past-stated-period. Navigation planned; link health unverified; metadata review 2026-09-19; game verification null. Public catalog intentionally exports only navigation identity fields, not verification metadata.

After: preserve lifecycle/event data; confirm navigation.v1 from deployed 1.3.0 integration and existing rollout checks. Guide HTTP 200 on 2026-10-02 at 14:02:29Z. Live Portal HTTP 200 at 14:02:49Z and four Ocean anchors all target the canonical guide URL without /docs/. Official sources returned 403: this is blocked verification, not proof the source is unavailable to users. HTTP evidence attached. Live nav.js HTTP 200 at 14:04:04Z, SHA-256 e0a75bce3f8ba21d73aff8aa28af1c624d977f1e8e3de483c6dd40785b3b84d2, matching immutable release 1.3.0.

Metadata review date 2026-10-02. Game-data verification remains null. No new NPC, quest, reward, coordinate, or game mechanics evidence is claimed. Official link health is not conflated with guide health. Visible card details separate metadata, menu integration, game verification and URL health. Existing archived CTA remains unchanged.

No nav release needed: snapshot/public catalog, runtime nav sources and release bytes remain unchanged. Release provenance verifies every historical source hash at sourceCommit. Current metadata registry and packaging verifier may differ; current runtime sources, generated projection and bundle must still exactly match the reviewed release. This corrects overly broad historical-source equality checks, rather than modifying the release.

Validation: baseline npm run check built successfully and unit stages passed; 4 Playwright pure cases passed, browser cases blocked by missing Chromium. Baseline browser limitation recorded here. After changes npm run publish:root (includes typecheck/schema validation/build) passed; npm run build:nav and npm run test:nav passed 3 tests; node --test tests/unit/*.test.mjs passed 14 tests. Python design-kit tests and full browser CI results are recorded in PR/latest CI. Tests explicitly preserve event period, archived/listed state, navigation capability and null game verification, plus desktop/mobile screenshots.

Not tested: actual devices, WebKit/Firefox, post-merge Pages. Official game-data verification unavailable (403). Other tools' outdated capability/health metadata is outside this Ocean-specific scope and unchanged.

Rollback: revert this feature commit. Historical nav releases and child apps are untouched. Generated root JS/HTML/service-worker cache revision necessarily update with Portal render data; no Pages setting/deployment change.
