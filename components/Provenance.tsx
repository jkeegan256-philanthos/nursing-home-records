import { CMS_DATASET_URL } from "@/lib/config";
import type { TableInfo } from "@/lib/data";

export default function Provenance({ info }: { info: TableInfo }) {
  return (
    <p className="prov">
      Source: {info.dataset_name ?? info.label} · file{" "}
      <span className="mono">{info.source_file}</span>
      {info.dataset_id ? (
        <>
          {" "}· CMS dataset{" "}
          <a
            className="mono"
            href={CMS_DATASET_URL(info.dataset_id)}
            rel="noopener noreferrer"
          >
            {info.dataset_id}
          </a>
        </>
      ) : null}
      {info.modified_date ? <> · last modified {info.modified_date}</> : null}
      {" "}· shown unmodified
    </p>
  );
}
