import { EXECUTOR_TEST_RECIPES, type ExecutorTestRecipe } from '../data/executorTests';
import type { EntityRef } from '../types';
import type { ImportedBuildMission } from '../types/executorContent';
import { normalize } from './executorIntegration';

export function testsForMission(mission: ImportedBuildMission): ExecutorTestRecipe[] {
  const text=normalize([mission.title,mission.summary,mission.objective,...mission.scripts,...mission.tasks.flatMap(t=>[t.title,t.purpose,...t.scripts])].join(' '));
  return EXECUTOR_TEST_RECIPES.filter(recipe=>recipe.missionKeywords.some(keyword=>text.includes(normalize(keyword))));
}

export function testsForEntity(ref: EntityRef): ExecutorTestRecipe[] {
  return EXECUTOR_TEST_RECIPES.filter(recipe=>recipe.entityTypes.includes(ref.type));
}

export function testRunKey(recipeId:string,ownerId?:string):string{return `${recipeId}::${ownerId??'global'}`;}
