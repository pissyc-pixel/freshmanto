"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { startNewRunAction } from "@/app/actions";
import { FmIcon } from "@/components/fm-ui/FmScaffold";
import type { CollegeTrack } from "@/types/game";

const disciplineOptions: Array<{
  value: CollegeTrack;
  label: string;
  description: string;
}> = [
  { value: "arts", label: "文科", description: "写作、调研、表达与组织能力更常出现" },
  { value: "science", label: "理科", description: "建模、科研、竞赛与学术积累更常出现" },
  { value: "engineering", label: "工科", description: "实验、项目、工程实践与技术竞赛更常出现" },
  { value: "business", label: "商科", description: "案例赛、实习、宣讲与资源整合更常出现" },
  { value: "medicine", label: "医科", description: "实验、见习、实践与长期压力管理更常出现" },
];

function NewGameSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="fm-button-primary"
      disabled={disabled || pending}
      aria-busy={pending}
      data-testid="new-game-submit"
    >
      <FmIcon name="spark" className="h-6 w-6" />
      <span>{pending ? "正在建档..." : "开始入学"}</span>
    </button>
  );
}

export function NewGameForm() {
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<CollegeTrack | "">("");
  const trimmedName = useMemo(() => name.trim(), [name]);
  const nameLength = trimmedName.length;
  const nameReady = nameLength >= 2 && nameLength <= 12;
  const nameError =
    trimmedName.length === 0
      ? "请填写姓名"
      : nameReady
        ? null
        : "姓名需要 2 到 12 个字符";
  const disciplineError = discipline === "" ? "请选择一个学科方向" : null;
  const canSubmit = nameReady && discipline !== "";

  return (
    <form action={startNewRunAction} className="fm-enroll-form" data-testid="new-game-form">
      <div className="fm-enroll-field">
        <label htmlFor="new-game-name" className="fm-enroll-label">
          姓名
        </label>
        <input
          id="new-game-name"
          name="name"
          type="text"
          required
          maxLength={12}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="输入你的姓名"
          className="fm-enroll-input"
          aria-invalid={Boolean(nameError)}
          aria-describedby="new-game-name-help"
          data-testid="new-game-name"
        />
        <p
          id="new-game-name-help"
          className={`fm-enroll-help ${nameError ? "is-error" : ""}`}
          data-testid="new-game-name-help"
        >
          {nameError ?? `将以“${trimmedName}”的名字建立本局档案。`}
        </p>
      </div>

      <div className="fm-enroll-field">
        <div className="fm-enroll-field__header">
          <p className="fm-enroll-label">学科方向</p>
          {discipline ? (
            <span className="fm-enroll-selection-note" data-testid="new-game-discipline-current">
              已选择：{disciplineOptions.find((option) => option.value === discipline)?.label}
            </span>
          ) : null}
        </div>
        <input type="hidden" name="discipline" value={discipline} data-testid="new-game-discipline-value" />
        <div className="fm-enroll-grid" data-testid="new-game-discipline-options" role="group" aria-label="学科方向">
          {disciplineOptions.map((option) => {
            const selected = discipline === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`fm-enroll-option ${selected ? "is-selected" : ""}`}
                aria-pressed={selected}
                data-selected={selected ? "true" : "false"}
                data-testid={`discipline-option-${option.value}`}
                onClick={() => setDiscipline(option.value)}
              >
                <span className="fm-enroll-option__header">
                  <span className="fm-enroll-option__title">{option.label}</span>
                  <span className={`fm-enroll-option__badge ${selected ? "is-visible" : ""}`} aria-hidden={!selected}>
                    已选
                  </span>
                </span>
                <span className="fm-enroll-option__copy">{option.description}</span>
              </button>
            );
          })}
        </div>
        <p
          className={`fm-enroll-help ${disciplineError ? "is-error" : ""}`}
          data-testid="new-game-discipline-help"
        >
          {disciplineError ?? "选择一个学科方向后，这一局会按你的真实选择进入开档。"}
        </p>
      </div>

      <NewGameSubmitButton disabled={!canSubmit} />
    </form>
  );
}
