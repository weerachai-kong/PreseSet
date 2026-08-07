export type AuditCreateFields = {
  createDate: Date;
  createBy: string;
  updateDate: Date | null;
  updateBy: string | null;
  isDelete: boolean;
};

export type AuditUpdateFields = {
  updateDate: Date;
  updateBy: string;
};

export function auditCreate(by: string): AuditCreateFields {
  return {
    createDate: new Date(),
    createBy: by,
    updateDate: null,
    updateBy: null,
    isDelete: false,
  };
}

export function auditUpdate(by: string): AuditUpdateFields {
  return {
    updateDate: new Date(),
    updateBy: by,
  };
}
