import { getSchedulesForAccess, getScheduleFormOptions } from "@/actions/schedule.actions";
import { SchedulesContent } from "./schedules-content";

export async function SchedulesView() {
  const [schedules, formOptions] = await Promise.all([
    getSchedulesForAccess(),
    getScheduleFormOptions().catch(() => ({ routes: [], buses: [], drivers: [] })),
  ]);

  return (
    <SchedulesContent
      schedules={JSON.parse(JSON.stringify(schedules))}
      formOptions={JSON.parse(JSON.stringify(formOptions))}
    />
  );
}
