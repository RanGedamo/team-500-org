import { CustomSelect } from "@/components/ui/customSelect/CustomSelect";
import { MyModal } from "@/components/ui/modal/modal";
import dayjs from "dayjs";
import React from "react";

type Assignment = {
  _id?: string;
  id?: string;
  userId: string;
  fullName?: string;
  position: string;
  shift: string;
  date: string;
  start: string;
  end: string;
};

type Guard = {
  userId: string;
  fullName: string;
};

type SwapRequestProps = {
  selectedAssignment: Assignment | null;
  guards: Guard[];
  swapRequest: { targetUser: string; message: string };
  setSwapRequest: React.Dispatch<
    React.SetStateAction<{ targetUser: string; message: string }>
  >;
  loading: {
    assignments: boolean;
    guards: boolean;
    submit: boolean;
    error: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
submitStatus: { success: boolean | null; message: string };
};

export const CardSwapRequest: React.FC<SwapRequestProps> = ({
  selectedAssignment,
  guards,
  swapRequest,
  setSwapRequest,
  loading,
  onSubmit,
  setIsOpen,
  isOpen,
  submitStatus,
}) => {
  if (!selectedAssignment) return null;

  const guardOptions = guards.map((g) => ({
    value: g.userId,
    label: g.fullName,
  }));

  const onChangeSelect = (value: string) => {
    setSwapRequest((s) => ({
      ...s,
      targetUser: value,
    }));
  };

  return (
    <div>
      <MyModal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        <h3 className="mb-3 text-center text-lg font-semibold text-blue-800">
          משמרת נבחרת
        </h3>
        <div className="mb-4 text-center text-gray-700">
          {selectedAssignment.position} • {selectedAssignment.shift} •{" "}
          {dayjs(selectedAssignment.date).format("dddd • DD/MM")} •{" "}
          {selectedAssignment.start}-{selectedAssignment.end}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-semibold">
              בחר מאבטח להחלפה:
            </label>
            {loading.guards ? (
              <div className="rounded border bg-gray-50 p-2 text-gray-600">
                טוען מאבטחים...
              </div>
            ) : (
              <CustomSelect
                value={swapRequest.targetUser}
                onChange={onChangeSelect}
                options={guardOptions}
                placeholder="בחר מאבטח להחלפה"
                searchable
                disabled={loading.submit}
                className="h-10"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block font-semibold">הערה (לא חובה):</label>
            <textarea
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={swapRequest.message}
              onChange={(e) =>
                setSwapRequest((s) => ({ ...s, message: e.target.value }))
              }
              placeholder="למשל: אשמח אם תוכל להחליף אותי במשמרת הזו 🙏"
            />
          </div>

{submitStatus.success === false && (
  <div className="rounded bg-red-100 p-3 text-red-700 text-center">
     {submitStatus.message}
  </div>
)}

{submitStatus.success === true && (
  <div className="rounded bg-green-100 p-3 text-green-700 text-center">
    ✅ {submitStatus.message}
  </div>
)}
<button
  type="submit"
  className={`w-full rounded py-2 font-bold text-white transition ${
    loading.submit ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
  }`}
  disabled={loading.submit}
>
  {loading.submit ? "שולח..." : "שלח בקשת חילוף"}
</button>
        </form>
      </MyModal>
    </div>
  );
};
