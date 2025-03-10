import { ResourceContainer } from "../../resources";
import { IResourceMeta } from "../meta";

export interface IChildResources<T> {
  resources: ResourceContainer<T>;
  meta: IResourceMeta<T>;
}
