import { Task, Project, TeamMember } from '../types';
import { sendAppsScriptAction } from './sheets';
import { formatDisplayDate } from './dateUtils';

interface SendTaskEmailOptions {
  task: Task;
  project?: Project;
  assignee?: TeamMember;
  assignorName: string;
  assignorEmail: string;
  assignorRole?: string;
  isReassignment?: boolean;
}

export async function sendTaskAssignmentEmail({
  task,
  project,
  assignee,
  assignorName,
  assignorEmail,
  assignorRole = 'Admin',
  isReassignment = false,
}: SendTaskEmailOptions): Promise<boolean> {
  const recipientEmail = (task.assigneeEmail || assignee?.email || '').trim();
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn('[EmailService] Task assignment email skipped: Assignee email missing or invalid:', recipientEmail);
    return false;
  }

  const projectName = project?.name || 'Scope 1 & 2 Emissions Inventory';
  const fullName = assignee?.name || task.assigneeEmail?.split('@')[0] || 'Team Member';
  const assigneeFirstName = fullName.split(' ')[0] || fullName;
  
  const subjectPrefix = isReassignment ? 'Action Required (Reassigned)' : 'Action Required';
  const subject = `${subjectPrefix}: ${task.title} - ${projectName}`;

  const formattedDueDate = formatDisplayDate(task.dueDate) || 'Not set';
  const formattedStartDate = formatDisplayDate(task.startDate) || 'Not set';

  const htmlBody = `
    <div style="font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif; max-width: 620px; margin: 0; color: #1f2937; line-height: 1.6; font-size: 15px; padding: 12px 0;">
      <p style="margin-top: 0;">Hi <strong>${assigneeFirstName}</strong>,</p>
      
      <p>I hope you are doing well.</p>

      <p>
        You have been assigned the task <strong>${task.title}</strong> under the <strong>${projectName}</strong> project. Please review the details below and complete the required deliverables prior to the deadline.
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 20px 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Task Summary: ${task.title}</h3>
        <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
          <li><strong>Project Name</strong>: ${projectName}</li>
          <li><strong>Priority Level</strong>: ${task.priority}</li>
          <li><strong>Start Date</strong>: ${formattedStartDate}</li>
          <li><strong>Target Deadline</strong>: <span style="color: #059669; font-weight: 700;">${formattedDueDate}</span></li>
        </ol>
      </div>

      <p style="margin-bottom: 24px;">
        Let's aim to have the initial draft ready by <strong>[${formattedDueDate}]</strong>. Let me know if you have any questions before then.
      </p>

      ${
        task.description
          ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <span style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 6px;">TASK DESCRIPTION:</span>
          <p style="font-size: 14px; color: #374151; margin: 0; white-space: pre-wrap;">${task.description}</p>
        </div>
      `
          : ''
      }
    </div>
  `;

  console.info(`[EmailService] Dispatching assignment email to ${recipientEmail} from ${assignorName} (${assignorEmail})...`);

  // Forward attached files if present on the task
  const attachments = task.attachments && Array.isArray(task.attachments) ? task.attachments : [];

  return sendAppsScriptAction('sendEmail', {
    recipientEmail,
    subject,
    htmlBody,
    replyTo: assignorEmail,
    senderName: 'Deepwoods Green',
    attachments,
  });
}
