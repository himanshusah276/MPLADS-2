import random
from datetime import date, datetime, timedelta, timezone
from faker import Faker
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.core.rbac import Role
from app.core.config import settings
from app.models.models import (
    State, District, Constituency, MP, ImplementingAgency, Contractor, Location,
    Project, Sanction, Expenditure, Payment, ProgressUpdate, Asset, Approval,
    RiskEvent, Alert, Case, CaseNote, Evidence, AuditLogEntry, User, ScoringConfig
)
from app.risk_engine.aggregator import evaluate_project_risk

fake = Faker('en_IN')
random.seed(42)

CATEGORIES = [
    {"name": "Road Construction", "cost_min": 1500000, "cost_max": 4500000, "median": 2800000, "duration": 180},
    {"name": "School Infrastructure", "cost_min": 1000000, "cost_max": 3500000, "median": 2200000, "duration": 210},
    {"name": "Community Hall", "cost_min": 2000000, "cost_max": 5000000, "median": 3200000, "duration": 240},
    {"name": "Drinking Water & Sanitation", "cost_min": 500000, "cost_max": 2500000, "median": 1400000, "duration": 120},
    {"name": "Drainage & Flood Mitigation", "cost_min": 1200000, "cost_max": 4000000, "median": 2500000, "duration": 180},
    {"name": "Health Sub-center", "cost_min": 2500000, "cost_max": 6000000, "median": 3800000, "duration": 270},
    {"name": "Sports Facility & Youth Center", "cost_min": 1500000, "cost_max": 4500000, "median": 2700000, "duration": 180},
    {"name": "Solar & Street Lighting", "cost_min": 300000, "cost_max": 1500000, "median": 800000, "duration": 90}
]

STATES_DATA = [
    {
        "name": "Karnataka", "code": "KA",
        "districts": ["Bengaluru Rural", "Bengaluru Urban", "Mysuru", "Belagavi", "Tumakuru", "Dakshina Kannada"],
        "coords": (12.9716, 77.5946)
    },
    {
        "name": "Maharashtra", "code": "MH",
        "districts": ["Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Kolhapur"],
        "coords": (19.7515, 75.7139)
    },
    {
        "name": "Rajasthan", "code": "RJ",
        "districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
        "coords": (27.0238, 74.2179)
    },
    {
        "name": "Uttar Pradesh", "code": "UP",
        "districts": ["Lucknow", "Varanasi", "Kanpur Nagar", "Agra", "Prayagraj", "Gorakhpur"],
        "coords": (26.8467, 80.9462)
    },
    {
        "name": "Tamil Nadu", "code": "TN",
        "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
        "coords": (11.1271, 78.6569)
    },
    {
        "name": "Assam", "code": "AS",
        "districts": ["Kamrup Metropolitan", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tezpur"],
        "coords": (26.2006, 92.9376)
    }
]

from app.services.ingestion.esakshi_loader import load_esakshi_and_seed

def seed_database(db: Session, target_project_count: int = 1500):
    return load_esakshi_and_seed(db, target_project_count)

    # 1. Seed Scoring Configuration
    default_config = db.query(ScoringConfig).first()
    if not default_config:
        default_config = ScoringConfig(
            config_name="default_weights",
            weights_json={
                "D1": 0.18, "D2": 0.22, "D3": 0.20, "D4": 0.12,
                "D5": 0.10, "D6": 0.08, "D7": 0.06, "D8": 0.04
            },
            thresholds_json={"critical_threshold": 85, "high_threshold": 65, "medium_threshold": 40}
        )
        db.add(default_config)
        db.commit()

    # 2. Seed States, Districts, Constituencies, MPs, Agencies
    state_objs = []
    district_objs = []
    constituency_objs = []
    mp_objs = []
    agency_objs = []

    for s_idx, s_data in enumerate(STATES_DATA):
        st = State(name=s_data["name"], code=s_data["code"])
        db.add(st)
        db.flush()
        state_objs.append(st)

        for d_idx, d_name in enumerate(s_data["districts"]):
            dist = District(name=d_name, state_id=st.id)
            db.add(dist)
            db.flush()
            district_objs.append(dist)

            # Constituency
            const = Constituency(name=f"{d_name} Constituency", house_type="Lok Sabha", district_id=dist.id, state_id=st.id)
            db.add(const)
            db.flush()
            constituency_objs.append(const)

            # MP
            mp = MP(
                name=f"Hon. MP {fake.name()}",
                house="Lok Sabha",
                party=random.choice(["National Progressive Party", "Democratic Front", "People's Alliance", "Independent"]),
                constituency_id=const.id,
                term_start=date(2024, 6, 1),
                term_end=date(2029, 5, 31)
            )
            db.add(mp)
            db.flush()
            mp_objs.append(mp)

            # Implementing Agencies
            for agy_type in ["Panchayati Raj Engineering Wing", "Public Works Department (PWD)", "Municipal Corporation Division"]:
                agy = ImplementingAgency(
                    name=f"{agy_type} - {d_name}",
                    type=agy_type,
                    district_id=dist.id
                )
                db.add(agy)
                db.flush()
                agency_objs.append(agy)

    # 3. Seed Contractors (~200)
    contractor_objs = []
    for c_idx in range(150):
        comp_name = f"{fake.last_name()} {random.choice(['Infra Projects Ltd', 'Constructions Pvt Ltd', 'Engineering Works', 'Builders & Associates', 'Enterprises'])}"
        reg_date = date(random.randint(2012, 2023), random.randint(1, 12), random.randint(1, 28))
        contractor = Contractor(
            name=comp_name,
            registration_no=f"REG-PWD-{random.randint(10000, 99999)}",
            pan_or_gstin=f"29AAACB{random.randint(1000, 9999)}P1Z{random.randint(1, 9)}",
            registered_since=reg_date,
            risk_flags=[]
        )
        db.add(contractor)
        db.flush()
        contractor_objs.append(contractor)

    # 4. Seed Demo Users matching Part 5
    default_pw_hash = get_password_hash("demo123")
    demo_users = [
        {
            "email": "analyst@mospi.gov.in",
            "name": "Rajesh Sharma (Central Ministry)",
            "role": Role.MINISTRY_ANALYST.value,
            "state_id": None, "district_id": None, "mp_id": None
        },
        {
            "email": "state.nodal.ka@mplads.gov.in",
            "name": "Sunita Rao (Karnataka Nodal)",
            "role": Role.STATE_NODAL_OFFICER.value,
            "state_id": state_objs[0].id, "district_id": None, "mp_id": None
        },
        {
            "email": "district.officer.blr@mplads.gov.in",
            "name": "Amit Hegde (Bengaluru Rural District)",
            "role": Role.DISTRICT_OFFICER.value,
            "state_id": state_objs[0].id, "district_id": district_objs[0].id, "mp_id": None
        },
        {
            "email": "mp.viewer.ka014@mplads.gov.in",
            "name": "Hon. MP K. Suresh",
            "role": Role.MP_VIEWER.value,
            "state_id": state_objs[0].id, "district_id": district_objs[0].id, "mp_id": mp_objs[0].id
        },
        {
            "email": "auditor.cag@mplads.gov.in",
            "name": "Vikramaditya Verma (Senior Auditor)",
            "role": Role.AUDITOR.value,
            "state_id": None, "district_id": None, "mp_id": None
        },
        {
            "email": "admin@mplads.gov.in",
            "name": "Neha Deshmukh (System Admin)",
            "role": Role.SYSTEM_ADMIN.value,
            "state_id": None, "district_id": None, "mp_id": None
        }
    ]

    for u_data in demo_users:
        u = User(
            email=u_data["email"],
            name=u_data["name"],
            hashed_password=default_pw_hash,
            role=u_data["role"],
            state_id=u_data["state_id"],
            district_id=u_data["district_id"],
            mp_id=u_data["mp_id"],
            is_active=True
        )
        db.add(u)

    db.commit()
    print("Administrative hierarchy, demo users, and contractors seeded.")

    # 5. Inject Named Ground-Truth Anomaly Showcase Projects (PRJ-2024-0091, etc.)
    karnataka_state = state_objs[0]
    blr_district = district_objs[0]
    primary_mp = mp_objs[0]
    primary_agency = agency_objs[0]
    primary_contractor = contractor_objs[0]

    # Location for Bengaluru Rural Showcase
    loc_primary = Location(
        latitude=13.0562,
        longitude=77.5921,
        address="Ward 14, Near Primary Health Sub-Centre, Doddaballapura Main Rd",
        district_id=blr_district.id
    )
    db.add(loc_primary)
    db.flush()

    # SHOWCASE PROJECT 1: PRJ-2024-0091 (Top Critical Flag: Payment Mismatch + Duplicate Link + Overrun)
    p1 = Project(
        project_code="PRJ-2024-0091",
        title="Widening of internal concrete road, Ward 14",
        category="Road Construction",
        description="Comprehensive widening and laying of CC concrete road at Ward 14 with side drains and culvert connections.",
        mp_id=primary_mp.id,
        agency_id=primary_agency.id,
        location_id=loc_primary.id,
        contractor_id=primary_contractor.id,
        sanctioned_cost=2900000.0,
        sanction_date=date(2024, 2, 10),
        expected_completion=date(2024, 8, 10),
        status="Active",
        current_risk_score=87,
        risk_band="Critical",
        injected_anomaly="payment_mismatch_and_duplicate"
    )
    db.add(p1)
    db.flush()

    # Sanction
    db.add(Sanction(project_id=p1.id, amount=2900000.0, sanction_date=date(2024, 2, 10), approving_authority="District Magistrate, Bengaluru Rural"))
    # Payments (₹18L released = 62% paid)
    db.add(Payment(payment_code="PAY-2024-3391", project_id=p1.id, contractor_id=primary_contractor.id, amount=1800000.0, payment_date=date(2024, 8, 12), installment_stage="Second Installment", injected_anomaly="payment_progress_mismatch"))
    # Progress (Only 15% physical progress)
    db.add(ProgressUpdate(progress_code="PRG-2024-8821", project_id=p1.id, progress_pct=15, update_date=date(2024, 8, 10), submitted_by="AE PWD Sub-division", remarks="Foundation and sub-base grading ongoing"))
    # Approval
    db.add(Approval(project_id=p1.id, stage="Administrative & Technical Sanction", requested_at=datetime(2024, 2, 1, 10, 0), approved_at=datetime(2024, 2, 3, 11, 0), duration_days=2, approver_name="Superintending Engineer"))

    # SHOWCASE PROJECT 2: PRJ-2023-1187 (Duplicate counterpart: 1.4km away, 89% similar description)
    loc_duplicate = Location(
        latitude=13.0610,
        longitude=77.5815,
        address="Ward 14 Extension, CC Road Connection, Doddaballapura",
        district_id=blr_district.id
    )
    db.add(loc_duplicate)
    db.flush()

    p2 = Project(
        project_code="PRJ-2023-1187",
        title="Widening of internal concrete road at Ward 14 Extension",
        category="Road Construction",
        description="Laying and widening of CC road at Ward 14 Extension with side drainage connections and culverts.",
        mp_id=primary_mp.id,
        agency_id=agency_objs[1].id, # sanctioned by different agency
        location_id=loc_duplicate.id,
        contractor_id=contractor_objs[1].id,
        sanctioned_cost=2750000.0,
        sanction_date=date(2023, 11, 15),
        expected_completion=date(2024, 5, 15),
        status="Active",
        current_risk_score=78,
        risk_band="High",
        injected_anomaly="duplicate_candidate"
    )
    db.add(p2)
    db.flush()
    db.add(Sanction(project_id=p2.id, amount=2750000.0, sanction_date=date(2023, 11, 15)))
    db.add(Payment(payment_code="PAY-2023-1092", project_id=p2.id, contractor_id=contractor_objs[1].id, amount=1200000.0, payment_date=date(2024, 1, 20), installment_stage="First Installment"))
    db.add(ProgressUpdate(progress_code="PRG-2024-0019", project_id=p2.id, progress_pct=40, update_date=date(2024, 2, 1), remarks="Culvert construction complete"))

    # SHOWCASE PROJECT 3: PRJ-2024-0114 (Cost Overrun outlier: Sanctioned ₹54L for Community Hall, peer median ₹32L)
    loc_overrun = Location(
        latitude=12.9820, longitude=77.6010, address="Nelamangala Town, Community Hall Compound", district_id=blr_district.id
    )
    db.add(loc_overrun)
    db.flush()
    p3 = Project(
        project_code="PRJ-2024-0114",
        title="Construction of Multi-purpose Community Hall, Nelamangala",
        category="Community Hall",
        description="Construction of 2-storey community welfare centre and auditorium at Nelamangala.",
        mp_id=primary_mp.id,
        agency_id=primary_agency.id,
        location_id=loc_overrun.id,
        contractor_id=contractor_objs[2].id,
        sanctioned_cost=5400000.0, # 68% above median
        sanction_date=date(2024, 1, 15),
        expected_completion=date(2024, 9, 15),
        status="Active",
        current_risk_score=74,
        risk_band="High",
        injected_anomaly="cost_overrun"
    )
    db.add(p3)
    db.flush()
    db.add(Sanction(project_id=p3.id, amount=5400000.0, sanction_date=date(2024, 1, 15)))
    db.add(Payment(payment_code="PAY-2024-0211", project_id=p3.id, contractor_id=contractor_objs[2].id, amount=2200000.0, payment_date=date(2024, 4, 10)))
    db.add(ProgressUpdate(progress_code="PRG-2024-1142", project_id=p3.id, progress_pct=35, update_date=date(2024, 5, 20), remarks="Structure column work"))

    # SHOWCASE PROJECT 4: PRJ-2023-0450 (Stale Ghost Execution: Sanctioned 240 days ago, no update in 214 days)
    loc_stale = Location(latitude=13.0110, longitude=77.5610, address="Hoskote Rural Water Station", district_id=blr_district.id)
    db.add(loc_stale)
    db.flush()
    p4 = Project(
        project_code="PRJ-2023-0450",
        title="Overhead Drinking Water Reservoir & RO Plant, Hoskote",
        category="Drinking Water & Sanitation",
        description="Installation of 50kL overhead tank and piped water distribution grid.",
        mp_id=primary_mp.id,
        agency_id=primary_agency.id,
        location_id=loc_stale.id,
        contractor_id=contractor_objs[3].id,
        sanctioned_cost=2400000.0,
        sanction_date=date(2023, 7, 10),
        expected_completion=date(2023, 12, 31),
        status="Active",
        current_risk_score=69,
        risk_band="High",
        injected_anomaly="stale_execution"
    )
    db.add(p4)
    db.flush()
    db.add(Sanction(project_id=p4.id, amount=2400000.0, sanction_date=date(2023, 7, 10)))
    db.add(Payment(payment_code="PAY-2023-9912", project_id=p4.id, contractor_id=contractor_objs[3].id, amount=1600000.0, payment_date=date(2023, 9, 15)))
    db.add(ProgressUpdate(progress_code="PRG-2023-5501", project_id=p4.id, progress_pct=25, update_date=date(2023, 10, 1), remarks="Tank foundation excavated"))

    # SHOWCASE PROJECT 5: Contractor Concentration Ring (Contractor 4 awarded 8 rapid projects)
    ring_contractor = contractor_objs[4]
    ring_contractor.name = "Apex Metro Infra Solutions Pvt Ltd"
    for r_idx in range(6):
        loc_r = Location(latitude=12.9500 + (r_idx * 0.01), longitude=77.6200 + (r_idx * 0.01), address=f"Sector {r_idx+1} Development Zone", district_id=blr_district.id)
        db.add(loc_r)
        db.flush()
        pr = Project(
            project_code=f"PRJ-2024-09{r_idx:02d}",
            title=f"Drainage Network & Culvert Construction Phase {r_idx+1}",
            category="Drainage & Flood Mitigation",
            description=f"Storm water drainage construction and culvert lining Phase {r_idx+1}.",
            mp_id=primary_mp.id,
            agency_id=random.choice(agency_objs[:3]).id,
            location_id=loc_r.id,
            contractor_id=ring_contractor.id,
            sanctioned_cost=3400000.0,
            sanction_date=date(2024, 3, 1) + timedelta(days=r_idx*12),
            expected_completion=date(2024, 10, 1),
            status="Active",
            current_risk_score=72,
            risk_band="High",
            injected_anomaly="contractor_concentration"
        )
        db.add(pr)
        db.flush()
        db.add(Sanction(project_id=pr.id, amount=3400000.0, sanction_date=pr.sanction_date))
        db.add(Payment(payment_code=f"PAY-2024-09{r_idx:02d}", project_id=pr.id, contractor_id=ring_contractor.id, amount=1500000.0, payment_date=pr.sanction_date + timedelta(days=20)))
        db.add(ProgressUpdate(progress_code=f"PRG-2024-09{r_idx:02d}", project_id=pr.id, progress_pct=20, update_date=pr.sanction_date + timedelta(days=25), remarks="Trenching underway"))

    db.commit()

    # 6. Generate Remaining Realistic Scale Projects (~1,000–2,500 projects)
    print(f"Generating realistic bulk projects across states...")
    all_projects = []
    
    current_proj_idx = 100
    for st in state_objs:
        st_data = next((s for s in STATES_DATA if s["code"] == st.code), STATES_DATA[0])
        base_lat, base_lng = st_data["coords"]
        st_districts = [d for d in district_objs if d.state_id == st.id]
        st_mps = [m for m in mp_objs if m.constituency and m.constituency.state_id == st.id]
        st_agencies = [a for a in agency_objs if a.district and a.district.state_id == st.id]

        projects_for_state = target_project_count // len(state_objs)
        for i in range(projects_for_state):
            current_proj_idx += 1
            cat = random.choice(CATEGORIES)
            dist = random.choice(st_districts)
            mp = random.choice(st_mps) if st_mps else primary_mp
            agency = random.choice(st_agencies) if st_agencies else primary_agency
            contractor = random.choice(contractor_objs)

            # Realistic cost around category median with log-normal variance
            cost_mult = random.lognormvariate(0, 0.22)
            cost = round(cat["median"] * cost_mult / 10000) * 10000
            cost = max(cat["cost_min"], min(cat["cost_max"], cost))

            # Realistic sanction date between 2023-01-01 and 2024-06-30
            days_ago = random.randint(60, 550)
            s_date = date.today() - timedelta(days=days_ago)
            duration_days = cat["duration"] + random.randint(-30, 60)
            comp_date = s_date + timedelta(days=duration_days)

            # Location offset
            lat_off = random.uniform(-0.8, 0.8)
            lng_off = random.uniform(-0.8, 0.8)
            loc = Location(
                latitude=base_lat + lat_off,
                longitude=base_lng + lng_off,
                address=f"{fake.street_name()}, {dist.name}",
                district_id=dist.id
            )
            db.add(loc)
            db.flush()

            status = "Active"
            if comp_date < date.today() - timedelta(days=60) and random.random() > 0.3:
                status = "Completed"

            # Title & Description
            title = f"{random.choice(['Construction of', 'Renovation of', 'Establishment of', 'Upgradation of'])} {cat['name']} at {fake.city()}"
            desc = f"{title} under MPLADS funds. Approved for local public utility and welfare enhancement."

            # Anomaly injection at ~3% rate
            anomaly_type = None
            risk_score = random.randint(10, 35) # normal baseline
            risk_band = "Low"

            proj = Project(
                project_code=f"PRJ-2024-B{current_proj_idx:04d}",
                title=title,
                category=cat["name"],
                description=desc,
                mp_id=mp.id,
                agency_id=agency.id,
                location_id=loc.id,
                contractor_id=contractor.id,
                sanctioned_cost=cost,
                sanction_date=s_date,
                expected_completion=comp_date,
                status=status,
                current_risk_score=risk_score,
                risk_band=risk_band,
                injected_anomaly=anomaly_type
            )
            db.add(proj)
            db.flush()

            # Sanction
            db.add(Sanction(project_id=proj.id, amount=cost, sanction_date=s_date))

            # Payments & Progress
            if status == "Completed":
                prog_pct = 100
                pay_amount = cost * random.uniform(0.92, 1.0)
            else:
                elapsed_pct = min(1.0, max(0.1, (date.today() - s_date).days / max(duration_days, 1)))
                prog_pct = min(90, int(elapsed_pct * 85 + random.randint(-10, 10)))
                prog_pct = max(5, prog_pct)
                pay_amount = cost * (prog_pct / 100.0) * random.uniform(0.9, 1.05)

            # Add payment
            db.add(Payment(
                payment_code=f"PAY-2024-B{current_proj_idx:04d}",
                project_id=proj.id,
                contractor_id=contractor.id,
                amount=round(pay_amount / 1000) * 1000,
                payment_date=s_date + timedelta(days=random.randint(20, max(25, (date.today() - s_date).days))),
                installment_stage="First/Second Installment"
            ))

            # Add progress update
            db.add(ProgressUpdate(
                progress_code=f"PRG-2024-B{current_proj_idx:04d}",
                project_id=proj.id,
                progress_pct=prog_pct,
                update_date=s_date + timedelta(days=random.randint(15, max(20, (date.today() - s_date).days))),
                submitted_by="Inspecting Engineer",
                remarks="Work execution proceeding as per approved estimates."
            ))

            # Add approval
            appr_days = random.randint(10, 28)
            db.add(Approval(
                project_id=proj.id,
                stage="Technical Sanction",
                requested_at=datetime.combine(s_date - timedelta(days=appr_days), datetime.min.time()),
                approved_at=datetime.combine(s_date, datetime.min.time()),
                duration_days=appr_days,
                approver_name="District Planning Officer"
            ))

    db.commit()
    print("Base seed committed successfully. Now computing risk scores across all projects...")

    # 7. Run initial scoring across projects to create RiskEvents & Alerts
    generate_initial_risk_events_and_alerts(db)
    print("Database seeding and risk scoring complete!")

def generate_initial_risk_events_and_alerts(db: Session):
    """
    Evaluates risk across all projects, populating RiskEvents, Alerts, and Cases for showcase items.
    """
    projects = db.query(Project).all()
    weights = settings.DEFAULT_WEIGHTS

    # Build context caches for peer evaluation
    peer_costs_by_key = {}
    for p in projects:
        key = (p.category, p.mp.constituency.state.name if p.mp and p.mp.constituency and p.mp.constituency.state else "National", p.sanction_date.year)
        if key not in peer_costs_by_key:
            peer_costs_by_key[key] = []
        peer_costs_by_key[key].append(p.sanctioned_cost)

    all_proj_dicts = []
    for p in projects:
        loc = {"latitude": p.location.latitude, "longitude": p.location.longitude} if p.location else {}
        all_proj_dicts.append({
            "id": p.id,
            "project_code": p.project_code,
            "title": p.title,
            "category": p.category,
            "description": p.description,
            "sanctioned_cost": p.sanctioned_cost,
            "sanction_date": p.sanction_date,
            "expected_completion": p.expected_completion,
            "status": p.status,
            "state_name": p.mp.constituency.state.name if p.mp and p.mp.constituency and p.mp.constituency.state else "Karnataka",
            "district_name": p.agency.district.name if p.agency and p.agency.district else "Bengaluru Rural",
            "sanction_year": p.sanction_date.year,
            "contractor_id": p.contractor_id,
            "contractor_name": p.contractor.name if p.contractor else None,
            "agency_id": p.agency_id,
            "location": loc,
            "payments": [{"amount": pay.amount, "payment_code": pay.payment_code, "payment_date": pay.payment_date} for pay in p.payments],
            "progress_updates": [{"progress_pct": prg.progress_pct, "update_date": prg.update_date} for prg in p.progress_updates],
            "approval_duration_days": p.approvals[0].duration_days if p.approvals else 14,
            "contractor_age_years": 4.5
        })

    # Group projects by contractor
    contractor_projs_map = {}
    for pd in all_proj_dicts:
        cid = pd.get("contractor_id")
        if cid:
            if cid not in contractor_projs_map:
                contractor_projs_map[cid] = []
            contractor_projs_map[cid].append(pd)

    for p_idx, (p_orm, p_dict) in enumerate(zip(projects, all_proj_dicts)):
        key = (p_dict["category"], p_dict["state_name"], p_dict["sanction_year"])
        peer_costs = peer_costs_by_key.get(key, [])
        contractor_projs = contractor_projs_map.get(p_dict.get("contractor_id"), [])

        context = {
            "peer_costs": peer_costs,
            "all_projects_in_state": all_proj_dicts[:200], # evaluated against state pool
            "contractor_all_projects": contractor_projs,
            "total_district_projects": 50,
            "peer_approval_durations": [14, 21, 28, 18, 15, 30]
        }

        eval_res = evaluate_project_risk(p_dict, context, weights)
        
        # Update project score & band
        p_orm.current_risk_score = eval_res["score"]
        p_orm.risk_band = eval_res["risk_band"]
        p_orm.last_scored_at = datetime.now(timezone.utc)

        # Store RiskEvents
        for det_res in eval_res["detector_results"]:
            re = RiskEvent(
                project_id=p_orm.id,
                detector_code=det_res["detector_code"],
                detector_name=det_res["detector_name"],
                subscore=det_res["subscore"],
                confidence=det_res["confidence"],
                evidence_json=det_res["evidence"],
                reason_template=det_res.get("reason_text")
            )
            db.add(re)
            db.flush()

            # Generate Alert for Medium, High, or Critical risk events
            if det_res["subscore"] >= 65.0 and det_res.get("reason_text"):
                alt_code = f"ALT-{p_orm.sanction_date.year}-{random.randint(1000, 9999)}"
                severity = "Critical" if det_res["subscore"] >= 85.0 else "High"
                alert = Alert(
                    alert_code=alt_code,
                    project_id=p_orm.id,
                    risk_event_id=re.id,
                    detector_code=det_res["detector_code"],
                    severity=severity,
                    status="New",
                    title=f"{det_res['detector_name']} Flag",
                    description=det_res["reason_text"],
                    confidence=det_res["confidence"]
                )
                db.add(alert)
                db.flush()

                # For showcase project PRJ-2024-0091, also initialize an active Case
                if p_orm.project_code == "PRJ-2024-0091" and det_res["detector_code"] == "D2":
                    case = Case(
                        case_number="CASE-2026-00042",
                        project_id=p_orm.id,
                        alert_id=alert.id,
                        owner_user_id="demo-user-auditor-001",
                        owner_name="Vikramaditya Verma (Senior Auditor)",
                        status="Under Review",
                        resolution=None,
                        resolution_reason=None
                    )
                    db.add(case)
                    db.flush()

                    alert.status = "Under Review"

                    # Add initial case note
                    note1 = CaseNote(
                        case_id=case.id,
                        author_id="demo-user-auditor-001",
                        author_name="Vikramaditya Verma",
                        author_role="Senior Auditor",
                        content="Initiated formal inquiry into 47% payment-progress gap. Released tranche ₹18L vs 15% physical progress warrants field measurement inspection."
                    )
                    db.add(note1)

                    # Add sample evidence
                    ev1 = Evidence(
                        case_id=case.id,
                        type="Payment Voucher & Bank Disbursal",
                        title="PFMS Payment Scroll PAY-2024-3391 (₹18,00,000)",
                        storage_url="/evidence/sample_pfms_scroll_3391.pdf"
                    )
                    db.add(ev1)

    db.commit()
    print("Initial risk events, alerts, and cases generated successfully!")
