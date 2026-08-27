#!/usr/bin/env python3
"""
Build a miniature replica of the CMS nursing-homes theme zip at
build/fixture/theme_fixture.zip. File names, headers, and the manifest
schema match the real June 2026 download; the rows are fabricated.

Use it to test the pipeline without the 39 MB real zip:

    NH_PARTITION_MIN_BYTES=500 python3 scripts/build_data.py \
        --zip build/fixture/theme_fixture.zip
"""

import csv
import io
import json
import random
import zipfile
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "build" / "fixture"
STATES = ["AL", "UT", "WY", "DC"]
random.seed(2026)

PROVIDER_COLS = [
    "CMS Certification Number (CCN)", "Provider Name", "Provider Address",
    "City/Town", "State", "ZIP Code", "Telephone Number",
    "Provider SSA County Code", "County/Parish", "Urban", "Ownership Type",
    "Number of Certified Beds", "Average Number of Residents per Day",
    "Average Number of Residents per Day Footnote", "Provider Type",
    "Provider Resides in Hospital", "Legal Business Name",
    "Date First Approved to Provide Medicare and Medicaid Services",
    "Chain Name", "Chain ID", "Number of Facilities in Chain",
    "Continuing Care Retirement Community", "Special Focus Status",
    "Abuse Icon", "Overall Rating", "Health Inspection Rating",
    "QM Rating", "Staffing Rating", "Location", "Processing Date",
]

CITATION_COLS = [
    "CMS Certification Number (CCN)", "Provider Name", "Provider Address",
    "City/Town", "State", "ZIP Code", "Survey Date", "Survey Type",
    "Deficiency Prefix", "Deficiency Category", "Deficiency Tag Number",
    "Deficiency Description", "Scope Severity Code", "Deficiency Corrected",
    "Correction Date", "Inspection Cycle", "Standard Deficiency",
    "Complaint Deficiency", "Infection Control Inspection Deficiency",
    "Citation under IDR", "Citation under IIDR", "Location", "Processing Date",
]


OWNERSHIP_COLS = [
    "CMS Certification Number (CCN)", "Provider Name", "Provider Address",
    "City/Town", "State", "ZIP Code",
    "Role played by Owner or Manager in Facility", "Owner Type",
    "Owner Name", "Ownership Percentage", "Association Date",
    "Location", "Processing Date",
]

def facility(i: int, st: str) -> dict:
    ccn = f"{i:06d}"
    return {
        "CMS Certification Number (CCN)": ccn,
        "Provider Name": f"{st} CARE CENTER {i}",
        "Provider Address": f"{100 + i} MAIN ST",
        "City/Town": f"{st}VILLE",
        "State": st,
        "ZIP Code": f"0{8400 + i}"[:5],
        "Telephone Number": f"(801) 555-{1000 + i}",
        "Provider SSA County Code": "290",
        "County/Parish": "Example",
        "Urban": "Y",
        "Ownership Type": "For profit - Corporation",
        "Number of Certified Beds": str(40 + i * 3),
        "Average Number of Residents per Day": f"{30 + i * 2}.{i}",
        "Average Number of Residents per Day Footnote": "",
        "Provider Type": "Medicare and Medicaid",
        "Provider Resides in Hospital": "N",
        "Legal Business Name": f"{st} CARE CENTER {i}, LLC",
        "Date First Approved to Provide Medicare and Medicaid Services": "1994-04-01",
        "Chain Name": "EXAMPLE CHAIN" if i % 2 else "",
        "Chain ID": "77" if i % 2 else "",
        "Number of Facilities in Chain": "12" if i % 2 else "",
        "Continuing Care Retirement Community": "N",
        "Special Focus Status": "SFF Candidate" if i == 3 else "",
        "Abuse Icon": "Y" if i == 5 else "N",
        "Overall Rating": str(1 + (i % 5)),
        "Health Inspection Rating": str(1 + ((i + 1) % 5)),
        "QM Rating": str(1 + ((i + 2) % 5)),
        "Staffing Rating": str(1 + ((i + 3) % 5)),
        "Location": f"POINT (-111.9 40.7)",
        "Processing Date": "2026-06-01",
    }


def csv_bytes(cols: list[str], rows: list[dict]) -> bytes:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=cols, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue().encode("utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    facilities = [facility(i, STATES[i % len(STATES)]) for i in range(1, 13)]

    citations = []
    for f in facilities:
        for c in range(random.randint(2, 5)):
            citations.append({
                "CMS Certification Number (CCN)": f["CMS Certification Number (CCN)"],
                "Provider Name": f["Provider Name"],
                "Provider Address": f["Provider Address"],
                "City/Town": f["City/Town"],
                "State": f["State"],
                "ZIP Code": f["ZIP Code"],
                "Survey Date": f"2025-0{1 + c}-15",
                "Survey Type": "Health",
                "Deficiency Prefix": "F",
                "Deficiency Category": "Resident Assessment and Care Planning",
                "Deficiency Tag Number": f"0{655 + c}",
                "Deficiency Description": 'Develop and implement a "complete" care plan, per resident.',
                "Scope Severity Code": "D",
                "Deficiency Corrected": "Deficient, Provider has date of correction",
                "Correction Date": f"2025-0{2 + c}-20",
                "Inspection Cycle": "1",
                "Standard Deficiency": "Y",
                "Complaint Deficiency": "N",
                "Infection Control Inspection Deficiency": "N",
                "Citation under IDR": "N",
                "Citation under IIDR": "N",
                "Location": f["Location"],
                "Processing Date": "2026-06-01",
            })
    # one row with a blank state to exercise the _OTHER bucket
    stray = dict(citations[0])
    stray["State"] = ""
    citations.append(stray)


    ownership = []
    def own_row(f, name, typ, role, pct):
        return {
            "CMS Certification Number (CCN)": f["CMS Certification Number (CCN)"],
            "Provider Name": f["Provider Name"], "Provider Address": f["Provider Address"],
            "City/Town": f["City/Town"], "State": f["State"], "ZIP Code": f["ZIP Code"],
            "Role played by Owner or Manager in Facility": role, "Owner Type": typ,
            "Owner Name": name, "Ownership Percentage": pct,
            "Association Date": "since 01/01/2015", "Location": f["Location"],
            "Processing Date": "2026-06-01",
        }
    for f in facilities[:8]:
        ownership.append(own_row(f, "BIGSHOT, PAT", "Individual", "OPERATIONAL/MANAGERIAL CONTROL", "NOT APPLICABLE"))
    ownership.append(own_row(facilities[0], "BIGSHOT, PAT", "Individual", "5% OR GREATER DIRECT OWNERSHIP INTEREST", "50%"))
    for f in facilities[4:8]:
        ownership.append(own_row(f, "EXAMPLE HOLDINGS LLC", "Organization", "5% OR GREATER INDIRECT OWNERSHIP INTEREST", "100%"))
    ownership.append(own_row(facilities[1], "LONE, OWNER", "Individual", "CORPORATE OFFICER", "NOT APPLICABLE"))
    ownership.append(own_row(facilities[2], "", "None", "ADP OF THE SNF", "NO PERCENTAGE PROVIDED"))

    files: dict[str, bytes] = {
        "NH_ProviderInfo_Jun2026.csv": csv_bytes(PROVIDER_COLS, facilities),
        "NH_Ownership_Jun2026.csv": csv_bytes(OWNERSHIP_COLS, ownership),
        "NH_HealthCitations_Jun2026.csv": csv_bytes(CITATION_COLS, citations),
        "NH_FireSafetyCitations_Jun2026.csv": csv_bytes(CITATION_COLS, citations[:6]),
        "NH_Penalties_Jun2026.csv": csv_bytes(
            ["CMS Certification Number (CCN)", "Provider Name", "State",
             "Penalty Date", "Penalty Type", "Fine Amount", "Processing Date"],
            [{"CMS Certification Number (CCN)": f["CMS Certification Number (CCN)"],
              "Provider Name": f["Provider Name"], "State": f["State"],
              "Penalty Date": "2025-11-03", "Penalty Type": "Fine",
              "Fine Amount": "13575", "Processing Date": "2026-06-01"}
             for f in facilities[:4]],
        ),
        "NH_StateUSAverages_Jun2026.csv": csv_bytes(
            ["State or Nation", "Cycle 1 Total Number of Health Deficiencies"],
            [{"State or Nation": s, "Cycle 1 Total Number of Health Deficiencies": "7.1"}
             for s in STATES + ["NATION"]],
        ),
        "NH_CitationDescriptions_Jun2026.csv": csv_bytes(
            ["Deficiency Prefix", "Deficiency Tag Number", "Deficiency Description"],
            [{"Deficiency Prefix": "F", "Deficiency Tag Number": f"0{655 + c}",
              "Deficiency Description": "Care planning requirement."} for c in range(4)],
        ),
        "Skilled_Nursing_Facility_Quality_Reporting_Program_Provider_Data_Jun2026.csv": csv_bytes(
            ["CMS Certification Number (CCN)", "Provider Name", "State",
             "Measure Code", "Score", "Footnote"],
            [{"CMS Certification Number (CCN)": f["CMS Certification Number (CCN)"],
              "Provider Name": f["Provider Name"], "State": f["State"],
              "Measure Code": "S_001_01_OBS_RATE", "Score": "82.4", "Footnote": ""}
             for f in facilities],
        ),
        # deliberately absent from the manifest to exercise the warning path
        "NH_NewMystery_Jun2026.csv": csv_bytes(
            ["CMS Certification Number (CCN)", "State", "Value"],
            [{"CMS Certification Number (CCN)": "000001", "State": "UT", "Value": "1"}],
        ),
        "NH_Data_Dictionary.pdf": b"%PDF-1.4\n%fixture stand-in\n%%EOF\n",
    }

    manifest = []
    for name, blob in files.items():
        if name.endswith(".csv") and "Mystery" not in name:
            # One dataset carries an older date on purpose. Real theme
            # downloads mix vintages, because some datasets are annual,
            # and the footer renders CMS's dates as a range when they
            # differ. A fixture where every date is equal would leave
            # that branch executing for the first time in production.
            manifest.append({
                "name": name.split("_Jun2026")[0].replace("NH_", "").replace("_", " "),
                "dataset_id": f"fx{abs(hash(name)) % 9999:04d}",
                "type": "current",
                "modified_date": "2025-12-01" if name.startswith("Skilled_") else "2026-06-01",
                "access_level": "public",
                "private": False,
                "resources": [{"filename": name, "filesize": len(blob), "mime_type": "text/csv"}],
            })
    files["manifest.json"] = json.dumps(manifest, indent=4).encode("utf-8")

    zip_path = OUT / "theme_fixture.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, blob in files.items():
            zf.writestr(name, blob)
    print(f"wrote {zip_path} ({zip_path.stat().st_size:,} bytes, {len(files)} files)")


if __name__ == "__main__":
    main()
