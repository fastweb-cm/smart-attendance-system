import { faceMutation } from "@/services/face/mutation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

//enroll a new user face
export const useCreateFaceTemplate = () =>
    useMutation({
        ...faceMutation(),
        onSuccess: () =>
            toast.success("Operation was successfull")
    })
