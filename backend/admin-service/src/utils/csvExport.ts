// backend/admin-service/src/utils/csvExport.ts

/**
 * Convert array of objects to CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string => {
  if (data.length === 0) {
    return '';
  }
  
  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.map(escapeCSVValue).join(',');
  
  // Create data rows
  const dataRows = data.map(row =>
    csvHeaders
      .map(header => {
        const value = row[header];
        return escapeCSVValue(value);
      })
      .join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Escape CSV value
 */
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert to string
  let strValue = String(value);
  
  // Handle dates
  if (value instanceof Date) {
    strValue = value.toISOString();
  }
  
  // Escape quotes and wrap in quotes if needed
  if (
    strValue.includes(',') ||
    strValue.includes('"') ||
    strValue.includes('\n')
  ) {
    strValue = '"' + strValue.replace(/"/g, '""') + '"';
  }
  
  return strValue;
};

/**
 * Export users to CSV
 */
export const exportUsersToCSV = (
  users: Array<{
    id: string;
    name?: string;
    email: string;
    phone?: string;
    role: string;
    userType?: string;
    verificationStatus: string;
    isPremium: boolean;
    createdAt: Date;
  }>
): string => {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Role',
    'User Type',
    'Verification Status',
    'Premium',
    'Created At',
  ];
  
  const data = users.map(user => ({
    ID: user.id,
    Name: user.name || 'N/A',
    Email: user.email,
    Phone: user.phone || 'N/A',
    Role: user.role,
    'User Type': user.userType || 'N/A',
    'Verification Status': user.verificationStatus,
    Premium: user.isPremium ? 'Yes' : 'No',
    'Created At': user.createdAt.toISOString(),
  }));
  
  return convertToCSV(data, headers);
};

/**
 * Export properties to CSV
 */
export const exportPropertiesToCSV = (
  properties: Array<{
    id: string;
    title: string;
    propertyType: string;
    price?: number;
    city: string;
    state: string;
    status: string;
    adminApprovalStatus: string;
    ownerName: string;
    createdAt: Date;
  }>
): string => {
  const headers = [
    'ID',
    'Title',
    'Type',
    'Price (NGN)',
    'City',
    'State',
    'Status',
    'Approval Status',
    'Owner',
    'Created At',
  ];
  
  const data = properties.map(property => ({
    ID: property.id,
    Title: property.title,
    Type: property.propertyType,
    'Price (NGN)': property.price || 'N/A',
    City: property.city,
    State: property.state,
    Status: property.status,
    'Approval Status': property.adminApprovalStatus,
    Owner: property.ownerName,
    'Created At': property.createdAt.toISOString(),
  }));
  
  return convertToCSV(data, headers);
};

/**
 * Export transactions to CSV
 */
export const exportTransactionsToCSV = (
  transactions: Array<{
    id: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    paymentType: string;
    status: string;
    transactionId?: string;
    createdAt: Date;
  }>
): string => {
  const headers = [
    'ID',
    'User Name',
    'User Email',
    'Amount',
    'Currency',
    'Payment Type',
    'Status',
    'Transaction ID',
    'Created At',
  ];
  
  const data = transactions.map(txn => ({
    ID: txn.id,
    'User Name': txn.userName,
    'User Email': txn.userEmail,
    Amount: txn.amount,
    Currency: txn.currency,
    'Payment Type': txn.paymentType,
    Status: txn.status,
    'Transaction ID': txn.transactionId || 'N/A',
    'Created At': txn.createdAt.toISOString(),
  }));
  
  return convertToCSV(data, headers);
};

/**
 * Export marking jobs to CSV
 */
export const exportMarkingJobsToCSV = (
  jobs: Array<{
    id: string;
    propertyTitle: string;
    requestedByName: string;
    assignedAgentName?: string;
    status: string;
    markingFee: number;
    paymentStatus: string;
    createdAt: Date;
    completedAt?: Date;
  }>
): string => {
  const headers = [
    'ID',
    'Property',
    'Requested By',
    'Assigned Agent',
    'Status',
    'Fee (NGN)',
    'Payment Status',
    'Created At',
    'Completed At',
  ];
  
  const data = jobs.map(job => ({
    ID: job.id,
    Property: job.propertyTitle,
    'Requested By': job.requestedByName,
    'Assigned Agent': job.assignedAgentName || 'N/A',
    Status: job.status,
    'Fee (NGN)': job.markingFee,
    'Payment Status': job.paymentStatus,
    'Created At': job.createdAt.toISOString(),
    'Completed At': job.completedAt?.toISOString() || 'N/A',
  }));
  
  return convertToCSV(data, headers);
};

/**
 * Export support tickets to CSV
 */
export const exportSupportTicketsToCSV = (
  tickets: Array<{
    ticketNumber: string;
    userName: string;
    userEmail: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    createdAt: Date;
    resolvedAt?: Date;
  }>
): string => {
  const headers = [
    'Ticket Number',
    'User Name',
    'User Email',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Created At',
    'Resolved At',
  ];
  
  const data = tickets.map(ticket => ({
    'Ticket Number': ticket.ticketNumber,
    'User Name': ticket.userName,
    'User Email': ticket.userEmail,
    Title: ticket.title,
    Category: ticket.category,
    Priority: ticket.priority,
    Status: ticket.status,
    'Created At': ticket.createdAt.toISOString(),
    'Resolved At': ticket.resolvedAt?.toISOString() || 'N/A',
  }));
  
  return convertToCSV(data, headers);
};

/**
 * Download CSV file (browser-side utility)
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};