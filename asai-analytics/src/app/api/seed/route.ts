import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export async function POST() {
    try {
        console.log("Starting seeding with Firebase Admin SDK...");
        const batch = adminDb.batch();

        // 1. Seed Documents
        const documents = [
            {
                text: "Structural analysis of Project Phoenix shows adequate load-bearing capacity for the new additional floors. The soil testing results indicate a safe bearing capacity of 250 kN/m2.",
                metadata: {
                    fileName: "Phoenix_Structure_Report_v2.pdf",
                    client: "Acme Corp",
                    product: "Building Materials",
                    domain: "Technical Specifications",
                    uploadedBy: "Engineer A"
                },
                visualObservations: [" cracks observed in north wall", "water seepage in basement"],
                tables: []
            },
            {
                text: "The new safety regulations require all personnel to wear high-visibility vests and hard hats at all times. Failure to comply will result in immediate suspension.",
                metadata: {
                    fileName: "Site_Safety_Protocol_2024.docx",
                    client: "Global Build",
                    product: "Safety Equipment",
                    domain: "Regulations",
                    uploadedBy: "Safety Officer"
                },
                visualObservations: [],
                tables: []
            },
            {
                text: "Heavy machinery maintenance log for Excavator X-200. Replaced hydraulic fluid and inspected tracks. Next service due in 500 hours.",
                metadata: {
                    fileName: "Excavator_Maint_Log.xlsx",
                    client: "Metro Infrastructure",
                    product: "Heavy Machinery",
                    domain: "Technical Specifications",
                    uploadedBy: "Foreman"
                },
                visualObservations: ["wear and tear on bucket teeth"],
                tables: []
            },
            {
                text: "Contract agreement between Asai Construction and Subcontractor B for electrical wiring. Scope includes all internal wiring for 3 floors.",
                metadata: {
                    fileName: "Subcontractor_Agreement_Elec.pdf",
                    client: "Acme Corp",
                    product: "Building Materials",
                    domain: "Contracts",
                    uploadedBy: "Legal Dept"
                },
                visualObservations: [],
                tables: []
            },
            {
                text: "Meeting minutes from the client review with Global Build. The client requested a change in the facade material to usage of sustainable bamboo panels.",
                metadata: {
                    fileName: "Client_Meeting_Minutes_Jan24.docx",
                    client: "Global Build",
                    product: "Building Materials",
                    domain: "Contracts",
                    uploadedBy: "Project Manager"
                },
                visualObservations: [],
                tables: []
            }
        ];

        documents.forEach((data) => {
            const docRef = adminDb.collection("documents").doc();
            batch.set(docRef, {
                ...data,
                indexedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // 2. Seed Activities (Live Triage)
        const activities = [
            {
                type: 'sync',
                title: 'OneDrive Sync:',
                details: "'Site_Photos_Nov2023' folder updated (24 files synced). Status: Complete.",
                status: 'Complete',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                type: 'alert',
                title: 'AI Alert:',
                details: "Potential compliance issue detected in 'Subcontractor_Agreement_V2.docx' regarding labor safety clauses.",
                status: 'Review Required',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                type: 'new',
                title: 'New Document:',
                details: "'Steel_Beam_Specs_RevisionA.pdf' uploaded by John D. to Products category.",
                status: 'Indexed',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            },
            {
                type: 'sync',
                title: 'OneDrive Sync:',
                details: 'Daily project logs backup successful.',
                status: 'Complete',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }
        ];

        activities.forEach((data) => {
            const docRef = adminDb.collection("activities").doc();
            batch.set(docRef, data);
        });

        await batch.commit();
        console.log("Seeding complete!");

        return NextResponse.json({ message: "Database seeded successfully using Admin SDK!" });
    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
