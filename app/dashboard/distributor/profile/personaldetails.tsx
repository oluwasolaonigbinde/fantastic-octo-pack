/**
 * Distributor profile uses the same display-photo flow as buyer/engineer (ProfileWorkspace).
 * Re-export avoids a duplicate broken upload stub that referenced the wrong field and API.
 */
export { default } from "@/app/dashboard/buyer/profile/personaldetails";
