import { Request, Response } from 'express';
import XLSX from 'xlsx';
import { Task } from '../types';

/**
 * Formats a task title from underscore-separated text to normal words
 * @param title The task title to format
 * @returns The formatted task title
 */
const formatTaskTitle = (title: string): string => {
  // Replace underscores with spaces
  let formattedTitle = title.replace(/_/g, ' ');
  
  // Capitalize the first letter of each word
  formattedTitle = formattedTitle
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return formattedTitle;
};

/**
 * Exports tasks to an Excel file
 */
export const exportTasksToExcel = async (req: Request, res: Response) => {
  try {
    console.log('Export request received');
    console.log('Request body:', req.body);
    const { tasks, documentName } = req.body;
    console.log('Tasks from request:', tasks);
    console.log('Tasks length:', tasks ? tasks.length : 0);

    if (!tasks || !Array.isArray(tasks)) {
      console.error('Invalid tasks data:', tasks);
      return res.status(400).json({ error: 'Invalid tasks data' });
    }

    // Check if tasks have all required fields
    const validTasks = tasks.every((task: Task) => {
      const isValid = task.id && task.title && task.description;
      if (!isValid) {
        console.error('Invalid task:', task);
      }
      return isValid;
    });

    if (!validTasks) {
      console.error('Some tasks are missing required fields');
      return res.status(400).json({ error: 'Some tasks are missing required fields' });
    }

    // Prepare data for Excel
    const excelData = tasks.map((task: Task) => {
      console.log('Processing task for Excel:', task);
      return {
        'Task ID': task.id,
        'Title': formatTaskTitle(task.title),
        'Description': task.description,
        'Estimated Time': task.estimatedTime || ''
      };
    });
    console.log('Excel data prepared:', excelData);
    console.log('Excel data length:', excelData.length);

    // Create a worksheet directly from the data
    console.log('Creating worksheet');
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = {
      'A': 15, // Task ID
      'B': 30, // Title
      'C': 50, // Description
      'D': 20  // Estimated Time
    };
    
    worksheet['!cols'] = Object.values(columnWidths).map(width => ({ width }));
    
    // Style the header row
    const headerStyle = {
      fill: { fgColor: { rgb: "4F46E5" } }, // Indigo color
      font: { color: { rgb: "FFFFFF" }, bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    // Apply header styles
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = headerStyle;
    }
    
    // Create a new workbook and add the worksheet
    console.log('Creating workbook');
    const workbook = XLSX.utils.book_new();
    
    // Generate sheet name from document name or use default
    const sheetName = documentName 
      ? documentName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31) // Excel has a 31 char limit for sheet names
      : 'Tasks';
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer
    console.log('Generating Excel buffer');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log('Excel buffer generated, size:', excelBuffer.length);
    
    // Set headers for file download
    console.log('Setting response headers');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${sheetName}.xlsx`);
    
    // Send the file
    console.log('Sending Excel file');
    res.send(excelBuffer);
    console.log('Excel file sent successfully');
  } catch (error) {
    console.error('Error exporting tasks to Excel:', error);
    res.status(500).json({ 
      error: 'Failed to export tasks to Excel',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 