import { ScheduleItem } from "../data/schedule";

export const exportToGoogleTasks = async (accessToken: string, schedule: ScheduleItem[], dateStr: string) => {
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of schedule) {
        if (item.isBreak) continue;
        
        // Google Tasks requires due date to be RFC 3339 timestamp.
        const dueTime = new Date(`${dateStr}T${item.start}:00`).toISOString();
        
        try {
            const response = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: `[${item.start}-${item.end}] ${item.activity}`,
                    notes: item.notes,
                    due: dueTime,
                })
            });
            
            if (response.ok) {
                successCount++;
            } else {
                errorCount++;
                console.error('Failed to add task:', await response.text());
            }
        } catch (e) {
            errorCount++;
            console.error('Failed to add task exception:', e);
        }
    }
    
    return { successCount, errorCount };
}
