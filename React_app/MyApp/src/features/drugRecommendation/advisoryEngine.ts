import { DrugItem } from "./drugData";

export const generateAdvisory = (
  drug: DrugItem,
  riskLevel: string,
  ageGroup: "Adult" | "Child"
) => {

  const dosage =
    ageGroup === "Adult"
      ? drug.dosage_adult
      : drug.dosage_child;

  let urgencyMessage = "";
  let followUpMessage = "";

  if (riskLevel === "Emergency") {
    urgencyMessage = "Visit PHC immediately.";
    followUpMessage = "Do not delay treatment.";
  } else if (riskLevel === "Moderate") {
    urgencyMessage = "Visit PHC within 24 hours.";
    followUpMessage = `If not improved in ${drug.follow_up_days} days, visit PHC.`;
  } else {
    urgencyMessage = "Manage at home with monitoring.";
    followUpMessage = `If not improved in ${drug.follow_up_days} days, visit PHC.`;
  }

  return {
    medicine: drug.medicine,
    dosage,
    avoid: drug.avoid,
    red_flags: drug.red_flags,
    self_care: drug.self_care,
    urgencyMessage,
    followUpMessage
  };
};