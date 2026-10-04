import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPARE_LESSON, CONTINUOUS_LESSON, SIMPLE_LESSON, localLessonFor } from "./lesson.ts";

test("grammar questions still reach the built-in lessons", () => {
  assert.equal(localLessonFor("Present Continuous nima?"), CONTINUOUS_LESSON);
  assert.equal(localLessonFor("hozirgi davom etuvchi zamon"), CONTINUOUS_LESSON);
  assert.equal(localLessonFor("Present Simple nima?"), SIMPLE_LESSON);
  assert.equal(localLessonFor("Present Simple va Continuous farqi"), COMPARE_LESSON);
  assert.equal(localLessonFor("Simple bilan continuous solishtir"), COMPARE_LESSON);
});

test("unrelated questions never get a Present Simple/Continuous lesson", () => {
  for (const q of [
    "Fotosintez va xemosintez farqi",
    "Python va JavaScript solishtiring",
    "Rim imperiyasi vs Yunoniston",
    "Quyosh tizimi qanday tuzilgan?",
    "Avstraliya poytaxti qaysi?",
    "Inflyatsiya nima?",
  ]) {
    assert.equal(localLessonFor(q), null, q);
  }
});

test("other tenses are not mistaken for the present ones", () => {
  for (const q of ["Past Continuous nima?", "Past Simple qanday tuziladi?", "Future Simple", "Present Perfect"]) {
    assert.equal(localLessonFor(q), null, q);
  }
});
