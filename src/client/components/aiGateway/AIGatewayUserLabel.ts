interface WorkspaceMemberForLabel {
  userId: string;
  user: {
    nickname: string | null;
    username: string;
  };
}

export function createAIGatewayUserLabelFormatter(
  members: WorkspaceMemberForLabel[]
) {
  const labels = new Map(
    members.map((member) => {
      const name =
        member.user.nickname?.trim() || member.user.username.trim() || null;

      return [
        member.userId,
        name ? `${name} (${member.userId})` : member.userId,
      ] as const;
    })
  );

  return (userId: string) => labels.get(userId) ?? userId;
}
