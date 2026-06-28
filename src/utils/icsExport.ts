import { ScheduleItem } from "../data/schedule";
import { format, parse } from "date-fns";

export const generateICS = (scheduleData: ScheduleItem[], dateStr: string) => {
  const dtStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  
  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//V3 Progress Tracker//ID',
    'CALSCALE:GREGORIAN',
  ];

  scheduleData.forEach((item) => {
    // Parse Start and End
    // Handling cases where time crosses midnight (e.g. 23:50 to 05:00)
    let startDate = parse(`${dateStr} ${item.start}`, "yyyy-MM-dd HH:mm", new Date());
    let endDate = parse(`${dateStr} ${item.end}`, "yyyy-MM-dd HH:mm", new Date());

    if (item.start >= "23:00" && item.end <= "06:00") {
       // crosses midnight
       endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (item.start < "06:00" && item.start > "00:00" && startDate < new Date()) {
        // Just in case we're parsing early morning for the next day, though dateStr sets the day.
    }

    const dtStart = format(startDate, "yyyyMMdd'T'HHmmss");
    const dtEnd = format(endDate, "yyyyMMdd'T'HHmmss");
    
    // Convert to strict ID
    const uid = `${item.id}-${dateStr}@v3tracker.app`;

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${uid}`);
    icsLines.push(`DTSTAMP:${dtStamp}`);
    icsLines.push(`DTSTART;TZID=Asia/Jakarta:${dtStart}`);
    icsLines.push(`DTEND;TZID=Asia/Jakarta:${dtEnd}`);
    icsLines.push(`SUMMARY:${item.activity}`);
    icsLines.push(`DESCRIPTION:${item.notes || ''} (Durasi: ${item.duration}m)`);
    
    // Add Alarm 1 Minute Before!
    icsLines.push('BEGIN:VALARM');
    icsLines.push('TRIGGER:-PT1M');
    icsLines.push('ACTION:DISPLAY');
    icsLines.push(`DESCRIPTION:Persiapan 1 Menit: ${item.activity}`);
    icsLines.push('END:VALARM');
    
    // Add Alarm at Exact Time!
    icsLines.push('BEGIN:VALARM');
    icsLines.push('TRIGGER:-PT0M');
    icsLines.push('ACTION:DISPLAY');
    icsLines.push(`DESCRIPTION:Mulai Sesi: ${item.activity}`);
    icsLines.push('END:VALARM');

    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  return icsLines.join('\r\n');
};

export const downloadICS = (scheduleData: ScheduleItem[], dateStr: string) => {
  const icsContent = generateICS(scheduleData, dateStr);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Jadwal-${dateStr}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
