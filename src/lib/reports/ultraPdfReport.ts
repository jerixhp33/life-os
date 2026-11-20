import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { format } from 'date-fns';
import { supabase } from '../supabase/client';
import { fetchMonthlyTransactions, buildSpendingSummary, formatCurrency } from '../../features/finance/api';

export interface ReportGenerationProgress {
  status: string;
}

export async function generateUltraPdfReport(uid: string, currency = 'INR'): Promise<void> {
  // 1. Fetch user data in parallel
  const [profileRes, tasksRes, habitsRes, docsRes, txs] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).single(),
    supabase.from('tasks').select('*').eq('user_id', uid),
    supabase.from('habits').select('*').eq('user_id', uid),
    supabase.from('documents').select('*').eq('user_id', uid),
    fetchMonthlyTransactions(uid, 0)
  ]);

  const profile = profileRes.data;
  const tasks = tasksRes.data ?? [];
  const habits = habitsRes.data ?? [];
  const documents = docsRes.data ?? [];

  // 2. Compute Analytics
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const taskRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const urgentCount = tasks.filter((t) => t.priority === 'urgent').length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'low').length;

  const summary = buildSpendingSummary(txs, currency);
  const savingsRate = summary.total_income > 0
    ? Math.max(0, Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100))
    : 0;

  const sortedCategories = Object.entries(summary.by_category)
    .sort(([, a], [, b]) => b - a);

  const morningHabits = habits.filter((h) => h.time_of_day === 'morning').length;
  const afternoonHabits = habits.filter((h) => h.time_of_day === 'afternoon').length;
  const eveningHabits = habits.filter((h) => h.time_of_day === 'evening').length;
  const anytimeHabits = habits.filter((h) => h.time_of_day === 'anytime').length;

  const reportDate = format(new Date(), 'MMMM d, yyyy · h:mm a');

  // 3. Generate HTML Template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>LifeOS Executive Report</title>
  <style>
    @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 11pt;
    }
    .header-bar {
      border-bottom: 3px solid #6957E8;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 24pt;
      font-weight: 800;
      color: #6957E8;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 9pt;
      color: #64748B;
      margin: 2px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .report-meta {
      text-align: right;
      font-size: 9pt;
      color: #475569;
    }
    .user-pill {
      display: inline-block;
      background: #F1F5F9;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 3px;
    }
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #0F172A;
      margin: 22px 0 10px 0;
      border-left: 4px solid #6957E8;
      padding-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .kpi-label {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 15pt;
      font-weight: 800;
      color: #0F172A;
      margin-top: 4px;
    }
    .kpi-sub {
      font-size: 7.5pt;
      color: #10B981;
      font-weight: 600;
      margin-top: 2px;
    }
    .finance-overview {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .bar-track {
      background: #E2E8F0;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      margin: 10px 0;
    }
    .bar-fill {
      background: #6957E8;
      height: 100%;
      border-radius: 6px;
    }
    .cat-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9.5pt;
    }
    .cat-table th {
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
      color: #64748B;
      border-bottom: 1px solid #CBD5E1;
      padding: 6px 8px;
    }
    .cat-table td {
      padding: 7px 8px;
      border-bottom: 1px solid #F1F5F9;
    }
    .progress-cell-bar {
      background: #E2E8F0;
      height: 8px;
      border-radius: 4px;
      width: 140px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    .progress-cell-fill {
      background: #6957E8;
      height: 100%;
      border-radius: 4px;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 600;
    }
    .badge-urgent { background: #FEE2E2; color: #B91C1C; }
    .badge-high { background: #FFEDD5; color: #C2410C; }
    .badge-med { background: #FEF3C7; color: #B45309; }
    .badge-low { background: #E0E7FF; color: #3730A3; }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #E2E8F0;
      padding-top: 10px;
      font-size: 8pt;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-bar">
    <div>
      <h1 class="brand-title">LifeOS</h1>
      <p class="brand-sub">Personal Executive Life & Financial Statement</p>
    </div>
    <div class="report-meta">
      <div class="user-pill">${profile?.full_name ?? 'Manikandan'}</div>
      <div>${profile?.email ?? ''}</div>
      <div style="margin-top: 2px;">Generated: ${reportDate}</div>
    </div>
  </div>

  <!-- KPI Highlights -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Tasks Completion</div>
      <div class="kpi-value">${taskRate}%</div>
      <div class="kpi-sub">${completedTasks.length} of ${tasks.length} Done</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Savings (${currency})</div>
      <div class="kpi-value" style="color: ${summary.net >= 0 ? '#10B981' : '#EF4444'};">
        ${formatCurrency(summary.net, currency)}
      </div>
      <div class="kpi-sub">${savingsRate}% Saved</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Monthly Spend</div>
      <div class="kpi-value">${formatCurrency(summary.total_expenses, currency)}</div>
      <div class="kpi-sub" style="color: #64748B;">${txs.length} Transactions</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active Habits & Vault</div>
      <div class="kpi-value">${habits.length} Habits</div>
      <div class="kpi-sub" style="color: #64748B;">${documents.length} Stored Documents</div>
    </div>
  </div>

  <!-- Section 1: Financial Analytics (INR) -->
  <div class="section-title">Personal Financial Health (${currency})</div>
  <div class="finance-overview">
    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 10pt;">
      <div>Monthly Income: <span style="color: #10B981;">${formatCurrency(summary.total_income, currency)}</span></div>
      <div>Monthly Expenses: <span style="color: #EF4444;">${formatCurrency(summary.total_expenses, currency)}</span></div>
    </div>
    <div class="bar-track">
      <div class="bar-fill" style="width: ${summary.total_income > 0 ? Math.min(100, Math.round((summary.total_expenses / summary.total_income) * 100)) : 0}%;"></div>
    </div>
    <div style="font-size: 8pt; color: #64748B; text-align: right;">
      Expense to Income Ratio: ${summary.total_income > 0 ? Math.round((summary.total_expenses / summary.total_income) * 100) : 0}%
    </div>
  </div>

  <!-- Top Category Breakdown -->
  <table class="cat-table">
    <thead>
      <tr>
        <th>Category Name</th>
        <th>Visual Allocation</th>
        <th>Percentage</th>
        <th style="text-align: right;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${sortedCategories.length > 0 ? sortedCategories.map(([cat, amt]) => {
        const pct = summary.total_expenses > 0 ? Math.round((amt / summary.total_expenses) * 100) : 0;
        return `
          <tr>
            <td style="font-weight: 600;">${cat}</td>
            <td>
              <div class="progress-cell-bar">
                <div class="progress-cell-fill" style="width: ${pct}%;"></div>
              </div>
            </td>
            <td>${pct}%</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(amt, currency)}</td>
          </tr>
        `;
      }).join('') : `<tr><td colspan="4" style="text-align:center; color:#94A3B8;">No transactions recorded this month.</td></tr>`}
    </tbody>
  </table>

  <!-- Section 2: Tasks & Productivity Matrix -->
  <div class="section-title">Task Productivity & Priority Matrix</div>
  <div style="display: flex; gap: 12px; margin-bottom: 12px;">
    <div style="flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px;">
      <span class="badge badge-urgent">Urgent</span> <strong>${urgentCount}</strong>
    </div>
    <div style="flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px;">
      <span class="badge badge-high">High</span> <strong>${highCount}</strong>
    </div>
    <div style="flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px;">
      <span class="badge badge-med">Medium</span> <strong>${mediumCount}</strong>
    </div>
    <div style="flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px;">
      <span class="badge badge-low">Low</span> <strong>${lowCount}</strong>
    </div>
  </div>

  <table class="cat-table">
    <thead>
      <tr>
        <th>Task Title</th>
        <th>Priority</th>
        <th>Status</th>
        <th style="text-align: right;">Due Date</th>
      </tr>
    </thead>
    <tbody>
      ${tasks.slice(0, 8).map((t) => `
        <tr>
          <td style="font-weight: 600;">${t.title}</td>
          <td><span class="badge badge-${t.priority === 'urgent' ? 'urgent' : t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'med' : 'low'}">${t.priority.toUpperCase()}</span></td>
          <td>${t.status.toUpperCase()}</td>
          <td style="text-align: right;">${t.due_date ? format(new Date(t.due_date), 'MMM d, yyyy') : 'No Date'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Section 3: Routine Habits Distribution -->
  <div class="section-title">Daily Habits & Routine Distribution</div>
  <div style="display: flex; justify-content: space-between; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 16px; border-radius: 6px;">
    <div>Morning (08:00 AM): <strong>${morningHabits}</strong></div>
    <div>Afternoon (01:00 PM): <strong>${afternoonHabits}</strong></div>
    <div>Evening (08:00 PM): <strong>${eveningHabits}</strong></div>
    <div>Anytime: <strong>${anytimeHabits}</strong></div>
  </div>

  <!-- Footer -->
  <div class="footer">
    LifeOS Autonomous Operating System · Confidential Personal Data Statement · Stored Locally & Authenticated in Cloud Vault
  </div>

</body>
</html>
  `;

  // 4. Print to PDF File
  const { uri: printUri } = await Print.printToFileAsync({
    html,
    margins: { top: 20, bottom: 20, left: 20, right: 20 }
  });

  // 5. Transfer to accessible FileProvider cache directory for ExpoSharing
  const safeFileName = `LifeOS_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  const safeUri = `${FileSystem.cacheDirectory}${safeFileName}`;

  try {
    await FileSystem.copyAsync({
      from: printUri,
      to: safeUri
    });
  } catch {
    const base64Content = await FileSystem.readAsStringAsync(printUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    await FileSystem.writeAsStringAsync(safeUri, base64Content, {
      encoding: FileSystem.EncodingType.Base64
    });
  }

  // 6. Share / Open Native PDF Viewer
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(safeUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'LifeOS Ultra Executive PDF Statement',
      UTI: 'com.adobe.pdf'
    });
  }
}
