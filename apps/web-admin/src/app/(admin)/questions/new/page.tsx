"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

type Course = { id: string; name: string };

type Option = { option_text: string; is_correct: boolean };
type Blank = { blank_position: number; correct_answer: string; case_sensitive: boolean };

export default function QuestionFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("mcq");
  const [difficulty, setDifficulty] = useState("easy");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState<Option[]>([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false }
  ]);
  const [blanks, setBlanks] = useState<Blank[]>([{ blank_position: 1, correct_answer: "", case_sensitive: false }]);
  const [rubricText, setRubricText] = useState("");
  const [rubricMarks, setRubricMarks] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data.courses ?? [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!editId) return;
    api.get(`/questions/${editId}`).then((res) => {
      const q = res.data.question;
      setCourseId(q.course_id);
      setTopic(q.topic ?? "");
      setQuestionText(q.question_text);
      setQuestionType(q.question_type);
      setDifficulty(q.difficulty_level);
      setMarks(Number(q.marks));
      setMediaUrl(q.media_url ?? "");
      setExplanation(q.explanation ?? "");
      setOptions(res.data.options ?? []);
      setBlanks(res.data.blanks ?? []);
      if (res.data.rubrics?.[0]) {
        setRubricText(res.data.rubrics[0].rubric_text ?? "");
        setRubricMarks(Number(res.data.rubrics[0].max_marks ?? 0));
      }
    });
  }, [editId]);

  useEffect(() => {
    if (questionType === "true_false") {
      setOptions([
        { option_text: "True", is_correct: true },
        { option_text: "False", is_correct: false }
      ]);
    }
  }, [questionType]);

  const canPreview = useMemo(() => questionText.trim().length > 0, [questionText]);

  const submit = async () => {
    if (!courseId || !questionText) {
      setStatus("Course and question text are required.");
      return;
    }
    const form = new FormData();
    form.append("course_id", courseId);
    if (topic) form.append("topic", topic);
    form.append("question_text", questionText);
    form.append("question_type", questionType);
    form.append("difficulty_level", difficulty);
    form.append("marks", String(marks));
    if (explanation) form.append("explanation", explanation);
    if (mediaUrl) form.append("media_url", mediaUrl);
    if (mediaFile) form.append("file", mediaFile);

    if (questionType === "mcq" || questionType === "multi_select" || questionType === "true_false") {
      form.append("options", JSON.stringify(options));
    }
    if (questionType === "fill_blanks") {
      form.append("blanks", JSON.stringify(blanks));
    }
    if (questionType === "subjective") {
      form.append("rubric_text", rubricText);
      form.append("rubric_marks", String(rubricMarks));
    }

    try {
      if (editId) {
        await api.put(`/questions/${editId}`, form, { headers: { "Content-Type": "multipart/form-data" } });
        setStatus("Question updated.");
      } else {
        await api.post("/questions", form, { headers: { "Content-Type": "multipart/form-data" } });
        setStatus("Question created.");
        router.push("/questions");
      }
    } catch {
      setStatus("Failed to save question.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{editId ? "Edit Question" : "Add Question"}</h2>
        <p className="text-sm text-slate-400">Create questions with rich text and media.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Course</Label>
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value)}
              >
                <option value="mcq">MCQ</option>
                <option value="true_false">True/False</option>
                <option value="subjective">Subjective</option>
                <option value="fill_blanks">Fill in the Blanks</option>
                <option value="multi_select">Multi-select</option>
              </select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <Label>Marks</Label>
              <Input type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label>Question Text</Label>
            <div className="mt-2 rounded-md border border-white/10 bg-white text-black">
              <ReactQuill value={questionText} onChange={setQuestionText} />
            </div>
          </div>

          {questionType === "mcq" || questionType === "multi_select" || questionType === "true_false" ? (
            <div className="space-y-3">
              <Label>Options</Label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type={questionType === "mcq" || questionType === "true_false" ? "radio" : "checkbox"}
                    name="correct-option"
                    checked={opt.is_correct}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((item, i) =>
                          questionType === "multi_select"
                            ? i === idx
                              ? { ...item, is_correct: e.target.checked }
                              : item
                            : { ...item, is_correct: i === idx }
                        )
                      )
                    }
                    disabled={questionType === "true_false"}
                  />
                  <Input
                    value={opt.option_text}
                    placeholder={`Option ${idx + 1}`}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, option_text: e.target.value } : item))
                      )
                    }
                    disabled={questionType === "true_false"}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={questionType === "true_false"}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOptions((prev) => [...prev, { option_text: "", is_correct: false }])}
                disabled={questionType === "true_false"}
              >
                Add Option
              </Button>
            </div>
          ) : null}

          {questionType === "fill_blanks" ? (
            <div className="space-y-3">
              <Label>Fill in the Blanks (Use ___ in question text)</Label>
              {blanks.map((blank, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={blank.blank_position}
                    onChange={(e) =>
                      setBlanks((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, blank_position: Number(e.target.value) } : item
                        )
                      )
                    }
                  />
                  <Input
                    value={blank.correct_answer}
                    placeholder="Correct answer"
                    onChange={(e) =>
                      setBlanks((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, correct_answer: e.target.value } : item))
                      )
                    }
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={blank.case_sensitive}
                      onChange={(e) =>
                        setBlanks((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, case_sensitive: e.target.checked } : item))
                        )
                      }
                    />
                    Case sensitive
                  </label>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setBlanks((prev) => [
                    ...prev,
                    { blank_position: prev.length + 1, correct_answer: "", case_sensitive: false }
                  ])
                }
              >
                Add Blank
              </Button>
            </div>
          ) : null}

          {questionType === "subjective" ? (
            <div className="space-y-3">
              <Label>Rubric / Answer Key</Label>
              <textarea
                className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                rows={4}
                value={rubricText}
                onChange={(e) => setRubricText(e.target.value)}
              />
              <Input
                type="number"
                value={rubricMarks}
                onChange={(e) => setRubricMarks(Number(e.target.value))}
                placeholder="Rubric max marks"
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Image/Media URL</Label>
              <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
            </div>
            <div>
              <Label>Upload Media File</Label>
              <Input type="file" onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div>
            <Label>Explanation (shown after test)</Label>
            <textarea
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          {status && <p className="text-xs text-slate-400">{status}</p>}
          <Button onClick={submit}>{editId ? "Update Question" : "Create Question"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          {canPreview ? (
            <div className="rounded-md border border-white/10 bg-white p-4 text-black">
              <div dangerouslySetInnerHTML={{ __html: questionText }} />
            </div>
          ) : (
            <p className="text-sm text-slate-400">Enter a question to preview.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
