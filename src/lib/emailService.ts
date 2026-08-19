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
  assignorPhone?: string;
  isReassignment?: boolean;
}

function buildEmailSignature({
  assignorName,
  assignorRole = 'Admin',
  assignorEmail = 'prajeethv.deepwoods@gmail.com',
  assignorPhone = '9876543210',
}: {
  assignorName: string;
  assignorRole?: string;
  assignorEmail?: string;
  assignorPhone?: string;
}): string {
  const cleanName = assignorName || 'PrajeethvOM';
  const cleanRole = assignorRole || 'Admin';
  const cleanEmail = assignorEmail || 'prajeethv.deepwoods@gmail.com';
  const cleanPhone = assignorPhone || '9876543210';

  return `
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px;">Best regards,</p>
      <p style="margin: 0; font-weight: 700; color: #111827; font-size: 15px;">Sustainably Yours<sup>®</sup></p>
      <p style="margin: 0; font-weight: 700; color: #1f2937; font-size: 14px;">${cleanName}</p>
      <p style="margin: 0; color: #4b5563; font-size: 13px;">${cleanRole} - Green Initiatives</p>
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 13px;">M: ${cleanPhone}</p>

      <div>
        <table cellPadding="0" cellSpacing="0" border="0" style="font-family: inherit;">
          <tr>
            <td style="padding-bottom: 2px;">
              <span style="font-size: 18px; font-weight: 800; color: #047857; letter-spacing: 0.5px;">DEEPWOODS</span>
              <span style="font-size: 18px; font-weight: 800; color: #65a30d; letter-spacing: 0.5px; margin-left: 4px;">GREEN<sup>®</sup></span>
            </td>
          </tr>
        </table>
        <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #374151;">Deepwoods Green Initiatives Pvt Ltd</p>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Indiranagar, Bangalore</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; color: #059669;">E: <a href="mailto:${cleanEmail}" style="color: #059669; text-decoration: none;">${cleanEmail}</a></p>
      </div>
    </div>
  `;
}

export async function sendTaskAssignmentEmail({
  task,
  project,
  assignee,
  assignorName,
  assignorEmail,
  assignorRole = 'Admin',
  assignorPhone,
  isReassignment = false,
}: SendTaskEmailOptions): Promise<boolean> {
  const recipientEmail = (task.assigneeEmail || assignee?.email || '').trim();
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn('[EmailService] Task assignment email skipped: Assignee email missing or invalid:', recipientEmail);
    return false;
  }

  const projectName = project?.name || 'General / Daily Tasks';
  const fullName = assignee?.name || task.assigneeEmail?.split('@')[0] || 'Team Member';
  const assigneeFirstName = fullName.split(' ')[0] || fullName;
  
  const subjectPrefix = isReassignment ? 'Action Required (Reassigned)' : 'Action Required';
  const subject = `${subjectPrefix}: ${task.title} - ${projectName}`;

  const formattedDueDate = formatDisplayDate(task.dueDate) || 'Not set';
  const formattedStartDate = formatDisplayDate(task.startDate) || 'Not set';

  const accentColor = '#059669'; // Green accent for assignment
  const boxBg = '#f8fafc';
  const borderColor = '#059669';

  const htmlBody = `
    <div style="font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif; max-width: 620px; margin: 0; color: #1f2937; line-height: 1.6; font-size: 15px; padding: 12px 0;">
      <p style="margin-top: 0;">Hi <strong>${assigneeFirstName}</strong>,</p>
      
      <p>I hope you are doing well.</p>

      <p>
        You have been assigned the task <strong>${task.title}</strong> under the <strong>${projectName}</strong> project. Please review the details below and complete the required deliverables prior to the deadline.
      </p>

      <div style="background-color: ${boxBg}; border-left: 4px solid ${borderColor}; padding: 20px 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Task Summary: ${task.title}</h3>
        <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
          <li><strong>Project Name</strong>: ${projectName}</li>
          <li><strong>Priority Level</strong>: ${task.priority}</li>
          <li><strong>Start Date</strong>: ${formattedStartDate}</li>
          <li><strong>Target Deadline</strong>: <span style="color: ${accentColor}; font-weight: 700;">${formattedDueDate}</span></li>
        </ol>
      </div>

      <p style="margin-bottom: 24px;">
        Let's aim to have the initial draft ready by <strong>[${formattedDueDate}]</strong>. Let me know if you have any questions before diving in.
      </p>

      ${
        task.description
          ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
          <span style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 6px;">TASK DESCRIPTION:</span>
          <p style="font-size: 14px; color: #374151; margin: 0; white-space: pre-wrap;">${task.description}</p>
        </div>
      `
          : ''
      }

      ${buildEmailSignature({
        assignorName,
        assignorRole,
        assignorEmail,
        assignorPhone: assignorPhone || (assignee as any)?.phone || '9876543210',
      })}
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

export async function sendTaskDeadlineReminderEmail({
  task,
  project,
  assignee,
  assignorName,
  assignorEmail,
  assignorRole = 'Admin',
  assignorPhone,
}: SendTaskEmailOptions): Promise<boolean> {
  const recipientEmail = (task.assigneeEmail || assignee?.email || '').trim();
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn('[EmailService] Deadline reminder email skipped: Assignee email missing or invalid:', recipientEmail);
    return false;
  }

  const projectName = project?.name || 'General / Daily Tasks';
  const fullName = assignee?.name || task.assigneeEmail?.split('@')[0] || 'Team Member';
  const assigneeFirstName = fullName.split(' ')[0] || fullName;
  
  const subject = `⏰ Deadline Reminder: ${task.title} - ${projectName}`;
  const formattedDueDate = formatDisplayDate(task.dueDate) || 'Not set';
  const formattedStartDate = formatDisplayDate(task.startDate) || 'Not set';

  const accentColor = '#ea580c'; // Light Orange / Red accent for reminder
  const boxBg = '#fff7ed'; // Soft light-orange background tint
  const borderColor = '#f97316'; // Light Orange / Red left border

  const htmlBody = `
    <div style="font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif; max-width: 620px; margin: 0; color: #1f2937; line-height: 1.6; font-size: 15px; padding: 12px 0;">
      <p style="margin-top: 0;">Hi <strong>${assigneeFirstName}</strong>,</p>
      
      <p>I hope you are doing well.</p>

      <p>
        This is a friendly deadline reminder regarding the task <strong>${task.title}</strong> under the <strong>${projectName}</strong> project. Please review the details below and complete the required deliverables prior to the deadline.
      </p>

      <div style="background-color: ${boxBg}; border-left: 4px solid ${borderColor}; padding: 20px 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Task Summary: ${task.title}</h3>
        <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
          <li><strong>Project Name</strong>: ${projectName}</li>
          <li><strong>Priority Level</strong>: ${task.priority}</li>
          <li><strong>Start Date</strong>: ${formattedStartDate}</li>
          <li><strong>Target Deadline</strong>: <span style="color: ${accentColor}; font-weight: 700;">${formattedDueDate}</span></li>
        </ol>
      </div>

      <p style="margin-bottom: 24px;">
        Let's aim to have the initial draft ready by <strong>[${formattedDueDate}]</strong>. Let me know if you have any questions before then.
      </p>

      ${
        task.description
          ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
          <span style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 6px;">TASK DESCRIPTION:</span>
          <p style="font-size: 14px; color: #374151; margin: 0; white-space: pre-wrap;">${task.description}</p>
        </div>
      `
          : ''
      }

      ${buildEmailSignature({
        assignorName,
        assignorRole,
        assignorEmail,
        assignorPhone: assignorPhone || (assignee as any)?.phone || '9876543210',
      })}
    </div>
  `;

  console.info(`[EmailService] Dispatching deadline reminder email to ${recipientEmail} from ${assignorName} (${assignorEmail})...`);

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
