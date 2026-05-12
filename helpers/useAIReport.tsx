import { useMutation } from "@tanstack/react-query";
import { generateAIReport, InputType, OutputType } from "../endpoints/properties/ai_report_POST.schema";

export const useAIReport = () => {
  return useMutation<OutputType, Error, InputType>({
    mutationFn: (data) => generateAIReport(data),
  });
};