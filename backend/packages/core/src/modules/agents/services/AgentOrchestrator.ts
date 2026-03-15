import { ExtractionAgent, ExtractedReceipt } from './ExtractionAgent.js';
import { AuditAgent } from './AuditAgent.js';
import { CommunicationAgent } from './CommunicationAgent.js';

export class AgentOrchestrator {
    /**
     * Orchestrates the full multi-agent workflow for a receipt
     */
    static async runWorkflow(
        receiptBuffer: Buffer, 
        mimeType: string, 
        tenantId: string, 
        userId: string,
        receiptUrl: string
    ): Promise<{ success: boolean; message: string; data?: ExtractedReceipt }> {
        
        console.log(`[Orchestrator] Starting workflow for User: ${userId}, Tenant: ${tenantId}`);

        try {
            // Step 1: Extraction Agent (The Clerk)
            console.log('[Orchestrator] Step 1: Extraction Processing...');
            const extractedData = await ExtractionAgent.extractFromImage(receiptBuffer, mimeType);
            console.log('[Orchestrator] Extraction Complete:', extractedData.vendor);

            // Step 2: Audit Agent (The Controller)
            console.log('[Orchestrator] Step 2: Audit Analysis...');
            const auditResult = await AuditAgent.audit(extractedData, tenantId);
            console.log('[Orchestrator] Audit Complete:', auditResult.status);

            // Step 3: Communication Agent (The Secretary)
            console.log('[Orchestrator] Step 3: Communication & Filing...');
            const finalMessage = await CommunicationAgent.executeFinalAction(
                extractedData, 
                auditResult, 
                tenantId, 
                userId, 
                receiptUrl
            );
            console.log('[Orchestrator] Workflow Finished.');

            return {
                success: true,
                message: finalMessage,
                data: extractedData
            };

        } catch (error: any) {
            console.error('[Orchestrator] Workflow Error:', error.message);
            return {
                success: false,
                message: `Workflow failed: ${error.message}`
            };
        }
    }
}
