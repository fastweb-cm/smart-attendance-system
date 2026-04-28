import FaceAuth from "./FaceAuth";
import CardAuth from "./CardAuth";
import { AuthStep, AuthType, User } from "@/types";

export default function AuthStepRenderer({ step, onSuccess, onFailure, userId, auth_type, terminal_id, auth_type_id }: { step: AuthStep, onSuccess: (user: User, attendance_status: string, next_step: AuthType | null, attendance_type: string | null) => void; onFailure: (msg: string) => void; userId: number | null; auth_type: string; terminal_id: number | null; auth_type_id: number | null }) {
  switch (step.type) {
    case "face":
      return <FaceAuth onSuccess={onSuccess} onFailure={onFailure} auth_type={auth_type} userId={userId} terminal_id={terminal_id} auth_type_id={auth_type_id} />;

    case "card":
      return <CardAuth onSuccess={onSuccess} onFailure={onFailure} authType={auth_type} userId={userId} terminalId={terminal_id} authTypeId={auth_type_id}/>;

    default:
      return <div>Unknown auth type</div>;
  }
}
