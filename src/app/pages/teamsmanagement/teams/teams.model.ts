export class Teams {
    id: number;
    tenantId: number;
    name: string;
    parentId: number;
    ownerId: number;

    constructor(team) {
        this.id = team.id || 0;
        this.tenantId = team.tenantId;
        this.name = team.name;
        this.parentId = team.parentId;
        this.ownerId = team.ownerId;
    }
}

export class TeamMember {
    id: number;
    tenantId: number;
    teamId: number;
    memberId: number;
    teamMemberRoleId: number;

    constructor(teamMember) {
        this.id = teamMember.id || 0;
        this.tenantId = teamMember.tenantId;
        this.teamId = teamMember.teamId;
        this.memberId = teamMember.memberId;
        this.teamMemberRoleId = teamMember.teamMemberRoleId;
    }

}
