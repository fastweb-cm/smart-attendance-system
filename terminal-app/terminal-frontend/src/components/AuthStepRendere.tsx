import FaceAuth from "./FaceAuth";
import CardAuth from "./CardAuth";
import { AuthStep, User } from "@/types";

export default function AuthStepRenderer({ step, onSuccess, onFailure }: { step: AuthStep, onSuccess: (user: User) => void; onFailure: (msg: string) => void }) {
  switch (step.type) {
    case "face":
      return <FaceAuth onSuccess={onSuccess} onFailure={onFailure} />;

    case "card":
      return <CardAuth onSuccess={onSuccess} />;

    default:
      return <div>Unknown auth type</div>;
  }
}
